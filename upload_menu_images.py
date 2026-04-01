"""
Momotaro Sushi — Local Image Uploader
======================================
Reads local images, uploads them to S3, and writes the CloudFront URL
back to the corresponding item in DynamoDB.

Usage:
  pip install boto3 tqdm

  python upload_menu_images.py \
    --image-dir  ./menu_images \
    --table      momotaro-menu-items \
    --bucket     momotaro-menu-images \
    --cf-domain  https://dXXXXXX.cloudfront.net \
    --region     ca-central-1 \
    [--dry-run]               # print actions, skip uploads
    [--item-ids 42 67 88]     # only process specific ItemNumbers
    [--skip-existing]         # skip items that already have an ImageUrl
    [--workers 5]             # parallel uploads
"""

import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import boto3
from tqdm import tqdm

# ─────────────────────────────────────────────────────────────────────────────
# DYNAMODB
# ─────────────────────────────────────────────────────────────────────────────

def fetch_all_items(table_name: str, region: str) -> list[dict]:
    """Fetch all menu items from DynamoDB."""
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

def update_image_url(table_name: str, region: str, item_name: str, image_url: str):
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
    """Upload JPEG bytes to S3."""
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
# PROCESSING LOGIC
# ─────────────────────────────────────────────────────────────────────────────

def slugify(name: str) -> str:
    """Convert item name to a safe S3 key slug."""
    return name.lower().replace(" ", "-").replace("/", "-").replace("&", "and")

def process_local_item(
    item: dict,
    image_dir: Path,
    table_name: str,
    bucket: str,
    cf_domain: str,
    region: str,
    dry_run: bool
) -> dict:
    """Finds the local image, uploads to S3, and updates DynamoDB."""
    item_number = str(item.get("ItemNumber", "unknown"))
    item_name   = item.get("ItemName", "Unnamed Item")

    # Look for the local file named exactly after the ItemNumber
    img_path = image_dir / f"{item_number}.jpg"
    if not img_path.exists():
        img_path = image_dir / f"{item_number}.jpeg" # Fallback extension

    if not img_path.exists():
        return {"item": item_name, "status": "skipped", "reason": f"No file named {item_number}.jpg found"}

    s3_key = f"images/{slugify(item_name)}-{item_number}.jpg"
    cf_url = f"{cf_domain.rstrip('/')}/{s3_key}"

    if dry_run:
        return {"item": item_name, "status": "dry_run", "url": cf_url}

    try:
        # 1. Read local file
        with open(img_path, "rb") as f:
            image_bytes = f.read()

        # 2. Upload to S3
        upload_to_s3(bucket, region, s3_key, image_bytes)

        # 3. Update DynamoDB
        update_image_url(table_name, region, item_name, cf_url)

        return {"item": item_name, "status": "ok", "url": cf_url}

    except Exception as e:
        return {"item": item_name, "status": "error", "error": str(e)}

# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Upload local menu images to S3 and update DynamoDB")
    parser.add_argument("--image-dir",     default="./menu_images",    help="Directory containing the locally generated images")
    parser.add_argument("--table",         required=True,              help="DynamoDB table name")
    parser.add_argument("--bucket",        required=True,              help="S3 bucket name")
    parser.add_argument("--cf-domain",     required=True,              help="CloudFront base URL e.g. https://dXXX.cloudfront.net")
    parser.add_argument("--region",        default="ca-central-1",     help="AWS region")
    parser.add_argument("--dry-run",       action="store_true",        help="Print actions without uploading/updating")
    parser.add_argument("--item-ids",      nargs="*",                  help="Only process these ItemNumbers")
    parser.add_argument("--skip-existing", action="store_true",        help="Skip items that already have an ImageUrl")
    parser.add_argument("--workers",       type=int, default=5,        help="Parallel upload workers")
    parser.add_argument("--output-log",    default="upload_log.json",  help="JSON log of results")
    args = parser.parse_args()

    image_dir_path = Path(args.image_dir)
    if not image_dir_path.is_dir():
        sys.exit(f"Error: Directory '{args.image_dir}' does not exist.")

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

    print(f"\nProcessing {len(all_items)} item(s) against local directory '{args.image_dir}'...\n")

    # ── Process
    results = []

    if args.workers > 1:
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {
                pool.submit(
                    process_local_item, item, image_dir_path,
                    args.table, args.bucket, args.cf_domain, args.region, args.dry_run
                ): item
                for item in all_items
            }
            for future in tqdm(as_completed(futures), total=len(futures), unit="item"):
                results.append(future.result())
    else:
        for item in tqdm(all_items, unit="item"):
            result = process_local_item(
                item, image_dir_path,
                args.table, args.bucket, args.cf_domain, args.region, args.dry_run
            )
            results.append(result)

    # ── Summary
    ok      = [r for r in results if r["status"] == "ok"]
    errs    = [r for r in results if r["status"] == "error"]
    skips   = [r for r in results if r["status"] == "skipped"]
    dryruns = [r for r in results if r["status"] == "dry_run"]

    print(f"\n{'='*50}")
    print(f"Done.  ✓ {len(ok)} uploaded   ✗ {len(errs)} errors   ! {len(skips)} missing local files   ~ {len(dryruns)} dry-run")
    
    if errs:
        print("\nErrors:")
        for e in errs:
            print(f"  {e['item']}: {e['error']}")
            
    if skips:
        print("\nSkipped (Missing Local File):")
        for s in skips:
            print(f"  {s['item']}: {s['reason']}")

    # ── Write log
    with open(args.output_log, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nFull log written to {args.output_log}")

if __name__ == "__main__":
    main()