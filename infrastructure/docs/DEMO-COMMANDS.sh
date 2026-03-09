#!/bin/bash

# CodeFlow AI Platform - Demo Commands
# Quick reference for hackathon demo
# Copy and paste these commands during the live demo

# ============================================================================
# SETUP - Run these before the demo
# ============================================================================

# Set your API Gateway URL (replace with actual URL from CDK output)
export API_URL="https://YOUR-API-GATEWAY-URL.execute-api.ap-south-1.amazonaws.com/prod"

# Verify API is accessible
curl -X GET $API_URL/health || echo "API not accessible - check URL"

# ============================================================================
# DEMO PART 1: User Registration & Authentication (1.5 min)
# ============================================================================

echo "=== DEMO PART 1: User Registration ==="

# 1. Register new user
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "leetcode_username": "demo_student",
    "email": "demo@codeflow.ai",
    "password": "SecureDemo123!",
    "language_preference": "en"
  }' | jq

# SAVE THESE VALUES FROM RESPONSE:
# export TOKEN="<access_token_from_response>"
# export USER_ID="<user_id_from_response>"

# Example (replace with actual values):
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export USER_ID="550e8400-e29b-41d4-a716-446655440000"

# 2. Verify authentication works
curl -X GET "$API_URL/progress/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# ============================================================================
# DEMO PART 2: Profile Analysis (1.5 min)
# ============================================================================

echo "=== DEMO PART 2: Profile Analysis ==="

# 3. Analyze LeetCode profile
curl -X POST $API_URL/analyze/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "leetcode_username": "demo_student"
  }' | jq

# Expected output: Topic proficiency breakdown
# - Weak topics: < 40% proficiency
# - Moderate topics: 40-70% proficiency
# - Strong topics: > 70% proficiency

# 4. Get detailed topic breakdown
curl -X GET "$API_URL/analyze/$USER_ID/topics" \
  -H "Authorization: Bearer $TOKEN" | jq

# ============================================================================
# DEMO PART 3: Personalized Learning Path Generation (1.5 min)
# ============================================================================

echo "=== DEMO PART 3: Learning Path Generation ==="

# 5. Generate learning path with Bedrock
curl -X POST $API_URL/recommendations/generate-path \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "weak_topics": ["dynamic-programming", "graphs"],
    "strong_topics": ["arrays", "strings"],
    "proficiency_level": "intermediate"
  }' | jq

# Expected output: 20-30 problem sequence
# - 70%+ problems target weak topics
# - Logical progression: Easy → Medium → Hard
# - Each problem has a reason

# ============================================================================
# DEMO PART 4: Adaptive Problem Recommendation (1 min)
# ============================================================================

echo "=== DEMO PART 4: Adaptive Recommendation ==="

# 6. Get next recommended problem (Goldilocks algorithm)
curl -X GET "$API_URL/recommendations/next-problem?user_id=$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected output: Next problem with difficulty adjustment
# - Success rate ≥80% → Harder problem
# - Success rate ≤40% → Easier problem
# - 2+ consecutive failures → Force easier

# ============================================================================
# DEMO PART 5: AI Chat Mentor with RAG (2 min)
# ============================================================================

echo "=== DEMO PART 5: AI Chat Mentor ==="

# 7. Chat with AI mentor - Code debugging (FIRST QUERY - CACHE MISS)
curl -X POST $API_URL/chat-mentor \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "message": "Why is my DP solution getting TLE?",
    "code": "def solve(n):\n    if n <= 1:\n        return n\n    return solve(n-1) + solve(n-2)",
    "problem_id": "fibonacci-number"
  }' | jq

# Expected output:
# - Intent: CODE_DEBUGGING
# - Multi-step reasoning explanation
# - RAG sources cited
# - Cached: false (first time)
# - Response time: 2-5 seconds

# 8. Ask same question again (SECOND QUERY - CACHE HIT)
curl -X POST $API_URL/chat-mentor \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "message": "Why is my DP solution getting TLE?",
    "code": "def solve(n):\n    if n <= 1:\n        return n\n    return solve(n-1) + solve(n-2)",
    "problem_id": "fibonacci-number"
  }' | jq

# Expected output:
# - Same response as before
# - Cached: true
# - Cache hit time: <50ms
# - Cost savings: 99.3% ($0.0001 vs $0.015)

# 9. Ask concept question (uses Claude Haiku for cost optimization)
curl -X POST $API_URL/chat-mentor \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "message": "What is dynamic programming?",
    "problem_id": null
  }' | jq

# Expected output:
# - Intent: CONCEPT_QUESTION
# - Model used: haiku (10x cheaper than sonnet)
# - RAG sources from knowledge base

# ============================================================================
# DEMO PART 6: Adaptive Hint Generation (1 min)
# ============================================================================

echo "=== DEMO PART 6: Adaptive Hints ==="

# 10. Request hint - Level 1 (High-level approach)
curl -X POST $API_URL/recommendations/hint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "two-sum",
    "problem_description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "user_id": "'$USER_ID'",
    "hint_level": 1
  }' | jq

# Expected output:
# - Hint: High-level approach (no data structures mentioned)
# - No code snippets
# - Conceptual guidance only

# 11. Request hint - Level 2 (Data structure suggestion)
curl -X POST $API_URL/recommendations/hint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "two-sum",
    "problem_description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "user_id": "'$USER_ID'",
    "hint_level": 2
  }' | jq

# Expected output:
# - Hint: Suggests using hash map
# - Still no code
# - More specific than Level 1

# 12. Request hint - Level 3 (Algorithm outline)
curl -X POST $API_URL/recommendations/hint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "two-sum",
    "problem_description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "user_id": "'$USER_ID'",
    "hint_level": 3
  }' | jq

# Expected output:
# - Hint: Algorithm outline (iterate once, check complements)
# - Still no code
# - Most detailed hint

# ============================================================================
# DEMO PART 7: Progress Tracking & Gamification (30 sec)
# ============================================================================

echo "=== DEMO PART 7: Progress Tracking ==="

# 13. Check user progress
curl -X GET "$API_URL/progress/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected output:
# - Streak count (days)
# - Badges earned (7, 30, 100 day milestones)
# - Problems solved today
# - Total problems solved
# - Next milestone

# ============================================================================
# DEMO PART 8: Admin Analytics (30 sec)
# ============================================================================

echo "=== DEMO PART 8: Admin Analytics ==="

# 14. Get DAU/WAU/MAU metrics (requires admin API key)
curl -X GET "$API_URL/admin/analytics/dau" \
  -H "X-Api-Key: YOUR_ADMIN_API_KEY" | jq

# Expected output:
# - DAU: Daily active users
# - WAU: Weekly active users
# - MAU: Monthly active users
# - API metrics (avg response time, error rate)

# 15. Get retention metrics (requires admin API key)
curl -X GET "$API_URL/admin/analytics/retention" \
  -H "X-Api-Key: YOUR_ADMIN_API_KEY" | jq

# Expected output:
# - Day 1 retention: % users who return next day
# - Day 7 retention: % users who return after 7 days
# - Day 30 retention: % users who return after 30 days

# ============================================================================
# MONITORING - Show CloudWatch metrics during demo
# ============================================================================

echo "=== MONITORING: CloudWatch Metrics ==="

# Get cache hit rate (if CloudWatch is set up)
aws cloudwatch get-metric-statistics \
  --namespace CodeFlow \
  --metric-name CacheHitRate \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average \
  --region ap-south-1

# Get Bedrock invocation count
aws cloudwatch get-metric-statistics \
  --namespace CodeFlow \
  --metric-name BedrockInvocations \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --region ap-south-1

# Get API Gateway request count
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --region ap-south-1

# ============================================================================
# COST MONITORING - Show billing during demo
# ============================================================================

echo "=== COST MONITORING: AWS Billing ==="

# Get daily costs for last 7 days
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --region us-east-1

# Get current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 month ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --region us-east-1

# ============================================================================
# CLEANUP - Run after demo (optional)
# ============================================================================

echo "=== CLEANUP (Optional) ==="

# Delete demo user (optional)
# curl -X DELETE "$API_URL/users/$USER_ID" \
#   -H "Authorization: Bearer $TOKEN"

# Clear environment variables
# unset API_URL TOKEN USER_ID

# ============================================================================
# TROUBLESHOOTING
# ============================================================================

# If API returns 401 Unauthorized:
# - Check TOKEN is set correctly
# - Token may have expired (24h expiry) - login again

# If API returns 404 Not Found:
# - Check API_URL is correct
# - Verify endpoint path is correct

# If API returns 429 Too Many Requests:
# - Rate limit exceeded (100 req/min per user)
# - Wait 60 seconds and try again

# If API returns 500 Internal Server Error:
# - Check CloudWatch logs for Lambda errors
# - Verify DynamoDB tables exist
# - Check Bedrock model access is enabled

# ============================================================================
# DEMO TIPS
# ============================================================================

# 1. Test all commands before the demo
# 2. Have backup slides ready (in case API fails)
# 3. Use large terminal font (for visibility)
# 4. Install jq for JSON formatting: brew install jq
# 5. Pre-create demo user account (to save time)
# 6. Have CloudWatch dashboard open in browser
# 7. Prepare talking points for each command
# 8. Time yourself - aim for 8-10 minutes total
# 9. Practice the demo at least 3 times
# 10. Have a backup video recording (if live demo fails)

echo "Demo commands ready! Good luck with your presentation!"
