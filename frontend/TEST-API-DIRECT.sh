#!/bin/bash

# Test API endpoints directly with curl
# This helps verify the backend is working correctly

API_URL="https://n8e9ghd13g.execute-api.ap-south-1.amazonaws.com/dev"

echo "=== CodeFlow API Test Script ==="
echo ""

# Get token from user
read -p "Enter your access_token (from localStorage): " TOKEN

if [ -z "$TOKEN" ]; then
    echo "Error: No token provided"
    exit 1
fi

echo ""
echo "Testing with token: ${TOKEN:0:20}..."
echo ""

# Test 1: GET /progress/{user_id}
echo "1. Testing GET /progress/{user_id}"
read -p "Enter your user_id: " USER_ID

curl -X GET "$API_URL/progress/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo ""

# Test 2: GET /analyze/{user_id}/topics
echo "2. Testing GET /analyze/{user_id}/topics"
curl -X GET "$API_URL/analyze/$USER_ID/topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo ""
echo "=== Test Complete ==="
