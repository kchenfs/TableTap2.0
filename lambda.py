import json
import boto3
from decimal import Decimal

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('MomotaroSushiMenu_DB')

def decimal_default(obj):
    """A helper function to serialize Decimal objects to floats."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    # Print the entire incoming event to CloudWatch for easy debugging
    print("Received event:", json.dumps(event, indent=2))
    
    try:
        # ... (Your CORS and OPTIONS handling logic remains unchanged) ...
        allowed_origins = [
            'https://dine-in.momotarosushi.ca',
            'https://take-out.momotarosushi.ca',
            'http://localhost:3000'
        ]
        
        origin = event.get('headers', {}).get('origin') or event.get('headers', {}).get('Origin')
        
        cors_headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        }
        
        if origin and origin in allowed_origins:
            cors_headers['Access-Control-Allow-Origin'] = origin
        else:
            if origin:
                cors_headers['Access-Control-Allow-Origin'] = origin
            return {
                'statusCode': 403,
                'body': json.dumps({'error': f"Unauthorized Origin: {origin}"}),
                'headers': cors_headers
            }
            
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': cors_headers
            }

        # ---> START OF CORRECTION <---
        
        # 1. Use placeholders (starting with #) for all reserved words.
        # It's also a good practice for any attribute name you are not sure about.
        projection = "ItemName, #cat, #desc, ItemNumber, #loc, #opt, Price"

        # 2. Create a dictionary to map the placeholders to the real attribute names.
        expr_attr_names = {
            '#cat': 'Category',
            '#desc': 'Description',
            '#loc': 'Location',   # Not reserved, but using it is a safe habit.
            '#opt': 'Options'
        }

        # If it's a GET request and the origin is valid, proceed to fetch data
        # 3. Pass both the ProjectionExpression and the ExpressionAttributeNames to the scan operation.
        response = table.scan(
            ProjectionExpression=projection,
            ExpressionAttributeNames=expr_attr_names
        )
        
        # ---> END OF CORRECTION <---

        items = response.get('Items', [])
        
        # Sort the items numerically based on the ItemNumber field
        sorted_items = sorted(items, key=lambda x: int(x.get('ItemNumber', 0)))

        # Return the successful response with the menu data
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps(sorted_items, default=decimal_default)
        }

    except Exception as e:
        # If any other error occurs, log it and return a 500 Internal Server Error
        print("Error:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'An internal server error occurred.'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            }
        }