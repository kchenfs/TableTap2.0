"""
Momotaro Sushi — Menu Image Generator
======================================
Reads all items from DynamoDB, generates styled food photos via Gemini,
uploads to S3, and writes the CloudFront URL back to DynamoDB.

Usage:
  pip install google-genai boto3 Pillow tqdm

  python generate_menu_images.py \
    --references ./ref1.jpg ./ref2.jpg ./ref3.jpg \
    --table      momotaro-menu-items \
    --bucket     momotaro-menu-images \
    --cf-domain  https://dXXXXXX.cloudfront.net \
    --region     ca-central-1 \
    --api-key    YOUR_GEMINI_API_KEY \
    [--dry-run]               # print prompts, skip API calls
    [--item-ids 42 67 88]     # only process specific ItemNumbers
    [--skip-existing]         # skip items that already have an ImageUrl
    [--workers 3]             # parallel generation (be mindful of rate limits)
"""

import argparse
import base64
import io
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import boto3
from PIL import Image
from tqdm import tqdm

# ── Gemini client ────────────────────────────────────────────────────────────
try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    sys.exit("Run: pip install google-genai")

# ─────────────────────────────────────────────────────────────────────────────
# PROMPT ENGINEERING
# ─────────────────────────────────────────────────────────────────────────────

STYLE_PREAMBLE = """
You are generating a professional restaurant food photograph.
Match the exact plating style, lighting, and mood from the reference images provided —
same angle (slightly overhead or 45°), same warm dark-wood surface, same soft diffused light.
""".strip()

NEGATIVE_CONSTRAINTS = """
Do NOT add any ingredients not listed below.
Do NOT add sauces, garnishes, or toppings unless explicitly mentioned.
Do NOT add text, watermarks, decorative borders, black bars, or letterboxing.
CRITICAL INSTRUCTION: The image must completely fill the entire canvas edge-to-edge.
The image must look like a real photograph, not an illustration.
""".strip()

def build_prompt(item_name: str, description: str) -> str:
    """
    Build a prompt that anchors the image to the exact listed ingredients.
    The description from DynamoDB becomes the visual contract.
    """
    # Parse description into a comma-separated ingredient list for the model
    ingredient_line = description.strip().rstrip('.') if description.strip() else item_name

    return f"""{STYLE_PREAMBLE}

Dish name: {item_name}
Exact visible contents: {ingredient_line}

{NEGATIVE_CONSTRAINTS}

Photograph this dish exactly as described above. The image should show only the listed
components on a clean plate or wooden board. Crisp focus on the food, shallow depth of field,
appetising restaurant-quality presentation.
""".strip()


# ─────────────────────────────────────────────────────────────────────────────
# REFERENCE IMAGE HANDLING
# ─────────────────────────────────────────────────────────────────────────────

MAX_REF_DIMENSION = 1024   # px — keeps each reference well under 4 MB
MAX_REF_BYTES     = 3_500_000  # 3.5 MB safety ceiling before base64

def prepare_reference_image(path: str) -> tuple[bytes, str]:
    """
    Resize and compress a reference image so it fits within Gemini's limits.
    Returns (jpeg_bytes, mime_type).
    """
    img = Image.open(path).convert("RGB")

    # Resize if either dimension exceeds the max
    if max(img.size) > MAX_REF_DIMENSION:
        img.thumbnail((MAX_REF_DIMENSION, MAX_REF_DIMENSION), Image.LANCZOS)

    buf = io.BytesIO()
    quality = 88
    while True:
        buf.seek(0); buf.truncate()
        img.save(buf, format="JPEG", quality=quality)
        if buf.tell() <= MAX_REF_BYTES or quality <= 50:
            break
        quality -= 8   # progressively compress until it fits

    print(f"  Reference '{Path(path).name}': "
          f"{Image.open(path).size} → {img.size}, {buf.tell() // 1024} KB (q={quality})")
    return buf.getvalue(), "image/jpeg"


def load_references(paths: list[str]) -> list[dict]:
    """Load and prepare all reference images, return as Gemini Part dicts."""
    parts = []
    for p in paths:
        data, mime = prepare_reference_image(p)
        parts.append({"inline_data": {"mime_type": mime, "data": base64.b64encode(data).decode()}})
    return parts


# ─────────────────────────────────────────────────────────────────────────────
# DYNAMODB
# ─────────────────────────────────────────────────────────────────────────────

def fetch_all_items(table_name: str, region: str) -> list[dict]:
    """Full table scan — fine for a restaurant menu (hundreds of items, not millions)."""
    dynamo = boto3.resource("dynamodb", region_name=region)
    table  = dynamo.Table(table_name)

    items, last_key = [], None
    while True:
        kwargs = {"ExclusiveStartKey": last_key} if last_key else {}
        resp    = table.scan(**kwargs)
        items  += resp.get("Items", [])
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break

    print(f"Fetched {len(items)} items from DynamoDB table '{table_name}'")
    return items


def update_image_url(table_name: str, region: str, item_number: str, image_url: str, item_name: str):
    """Write the CloudFront URL back to the DynamoDB item."""
    dynamo = boto3.resource("dynamodb", region_name=region)
    table  = dynamo.Table(table_name)
    table.update_item(
        Key={"ItemName": item_name},
        UpdateExpression="SET ImageUrl = :u",
        ExpressionAttributeValues={":u": image_url},
    )


# ─────────────────────────────────────────────────────────────────────────────
# S3
# ─────────────────────────────────────────────────────────────────────────────

def upload_to_s3(bucket: str, region: str, key: str, image_bytes: bytes) -> str:
    """Upload JPEG bytes to S3, return the object key."""
    s3 = boto3.client("s3", region_name=region)
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=image_bytes,
        ContentType="image/jpeg",
        # Cache for 1 year — CloudFront will respect this
        CacheControl="public, max-age=31536000, immutable",
    )
    return key


# ─────────────────────────────────────────────────────────────────────────────
# GENERATION
# ─────────────────────────────────────────────────────────────────────────────

MODEL = "gemini-3-pro-image-preview"

MODEL = "gemini-3.1-flash-image-preview"

def generate_image(
    client,
    item_name: str,
    description: str,
    subject_parts: list[dict],
    style_parts: list[dict],
    dry_run: bool = False,
) -> bytes | None:
    """
    Call Gemini to generate a food image using interleaved subject and style references.
    """
    prompt_text = build_prompt(item_name, description)

    if dry_run:
        print(f"\n[DRY RUN] Prompt for '{item_name}':\n{prompt_text}\n")
        return None

    contents = []

    # 1. Inject Subject References (The Shape/Structure)
    if subject_parts:
        contents.append(genai_types.Part(text="Use the following images STRICTLY for the physical shape, structure, and ingredient layering of the food item. Do not copy the lighting or background from these images:"))
        for ref in subject_parts:
            contents.append(genai_types.Part(inline_data=genai_types.Blob(
                mime_type=ref["inline_data"]["mime_type"],
                data=base64.b64decode(ref["inline_data"]["data"]),
            )))

    # 2. Inject Style References (The Plating/Theme)
    if style_parts:
        contents.append(genai_types.Part(text="Use the following images STRICTLY for the artistic style: the exact plating, moody lighting, dark wood surfaces, and overall cinematic restaurant aesthetic:"))
        for ref in style_parts:
            contents.append(genai_types.Part(inline_data=genai_types.Blob(
                mime_type=ref["inline_data"]["mime_type"],
                data=base64.b64decode(ref["inline_data"]["data"]),
            )))

    # 3. Inject the final constraints and description
    contents.append(genai_types.Part(text=prompt_text))

    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=genai_types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=genai_types.ImageConfig(
                aspect_ratio="1:1"
            )
        ),
    )

    # Extract the image bytes from the response
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.mime_type.startswith("image/"):
            return part.inline_data.data   # raw bytes

    return None


def slugify(name: str) -> str:
    """Convert item name to a safe S3 key slug."""
    return name.lower().replace(" ", "-").replace("/", "-").replace("&", "and")


def process_item(
    item: dict,
    client,
    subject_parts: list[dict], # Updated from reference_parts
    style_parts: list[dict],   # Added
    table_name: str,
    bucket: str,
    cf_domain: str,
    region: str,
    dry_run: bool,
    retry_limit: int = 3,
) -> dict:
    """
    Full pipeline for one menu item:
      1. Build prompt from DynamoDB fields
      2. Call Gemini
      3. Upload to S3
      4. Update DynamoDB
    Returns a status dict.
    """
    item_number = str(item.get("ItemNumber", "unknown"))
    item_name   = item.get("ItemName", "Unnamed Item")
    description = item.get("Description", "")

    s3_key      = f"images/{slugify(item_name)}-{item_number}.jpg"
    cf_url      = f"{cf_domain.rstrip('/')}/{s3_key}"

    for attempt in range(1, retry_limit + 1):
        try:
            # Updated to pass both subject and style parts
            image_bytes = generate_image(client, item_name, description, subject_parts, style_parts, dry_run)

            if dry_run:
                return {"item": item_name, "status": "dry_run", "url": cf_url}

            if not image_bytes:
                raise ValueError("No image data in response")

            upload_to_s3(bucket, region, s3_key, image_bytes)
            update_image_url(table_name, region, item_number, cf_url, item_name)

            return {"item": item_name, "status": "ok", "url": cf_url}

        except Exception as e:
            if attempt < retry_limit:
                wait = 2 ** attempt   # exponential back-off: 2s, 4s
                time.sleep(wait)
            else:
                return {"item": item_name, "status": "error", "error": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate menu images with Gemini")
    parser.add_argument("--subject-refs", nargs="*", default=[], help="Photos showing the exact shape/structure of the sushi roll")
    parser.add_argument("--style-refs",   nargs="*", default=[], help="Photos showing the moody lighting, plating, and table theme")
    parser.add_argument("--table",         required=True,              help="DynamoDB table name")
    parser.add_argument("--bucket",        required=True,              help="S3 bucket name")
    parser.add_argument("--cf-domain",     required=True,              help="CloudFront base URL e.g. https://dXXX.cloudfront.net")
    parser.add_argument("--region",        default="ca-central-1",     help="AWS region")
    parser.add_argument("--api-key",       default=os.getenv("GEMINI_API_KEY"), help="Gemini API key (or set GEMINI_API_KEY env var)")
    parser.add_argument("--dry-run",       action="store_true",        help="Print prompts without calling the API")
    parser.add_argument("--item-ids",      nargs="*",                  help="Only process these ItemNumbers")
    parser.add_argument("--skip-existing", action="store_true",        help="Skip items that already have an ImageUrl")
    parser.add_argument("--workers",       type=int, default=1,        help="Parallel workers (default 1 — increase carefully)")
    parser.add_argument("--output-log",    default="generation_log.json", help="JSON log of results")
    args = parser.parse_args()

    if not args.api_key:
        sys.exit("Provide --api-key or set GEMINI_API_KEY environment variable")

    # ── Gemini client
    client = genai.Client(api_key=args.api_key)

    # ── Load and prepare reference images
    print("\nPreparing reference images...")
    subject_parts = load_references(args.subject_refs)
    style_parts = load_references(args.style_refs)
    print(f"Loaded {len(subject_parts)} subject reference(s) and {len(style_parts)} style reference(s)\n")

    # ── Fetch menu from DynamoDB
    all_items = fetch_all_items(args.table, args.region)

    # ── Filter
    if args.item_ids:
        all_items = [i for i in all_items if str(i.get("ItemNumber", "")) in args.item_ids]
        print(f"Filtered to {len(all_items)} item(s) by --item-ids")

    if args.skip_existing:
        before = len(all_items)
        all_items = [i for i in all_items if not i.get("ImageUrl")]
        print(f"Skipped {before - len(all_items)} item(s) that already have an ImageUrl")

    if not all_items:
        print("No items to process. Exiting.")
        return

    print(f"\nGenerating images for {len(all_items)} item(s)...\n")

    # ── Process
    results = []

    if args.workers > 1:
        # Parallel — useful if you have a high API quota
        # Note: Gemini has rate limits; keep workers ≤ 3 to avoid 429s
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {
                pool.submit(
                    process_item, item, client, subject_parts, style_parts, # Updated these two variables
                    args.table, args.bucket, args.cf_domain, args.region, args.dry_run
                ): item
                for item in all_items
            }
            for future in tqdm(as_completed(futures), total=len(futures), unit="item"):
                results.append(future.result())
    else:
        # Sequential — safer, easier to debug
        for item in tqdm(all_items, unit="item"):
            result = process_item(
                item, client, subject_parts, style_parts, # pass both lists here
                args.table, args.bucket, args.cf_domain, args.region, args.dry_run
            )
            results.append(result)
            # Small pause between requests to stay within free-tier limits
            if not args.dry_run:
                time.sleep(1.5)

    # ── Summary
    ok    = [r for r in results if r["status"] == "ok"]
    errs  = [r for r in results if r["status"] == "error"]
    skips = [r for r in results if r["status"] == "dry_run"]

    print(f"\n{'='*50}")
    print(f"Done.  ✓ {len(ok)} generated   ✗ {len(errs)} errors   ~ {len(skips)} dry-run")
    if errs:
        print("\nErrors:")
        for e in errs:
            print(f"  {e['item']}: {e['error']}")

    # ── Write log
    with open(args.output_log, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nFull log written to {args.output_log}")


if __name__ == "__main__":
    main()