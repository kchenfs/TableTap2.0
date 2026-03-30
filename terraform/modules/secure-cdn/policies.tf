# 5. The Bucket Policy allowing ONLY CloudFront to read the images
data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.image_bucket.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "apply_policy" {
  bucket = aws_s3_bucket.image_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}