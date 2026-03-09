# CodeFlow AI API - Quick Start Guide

## Getting Started in 5 Minutes

### 1. Register and Get Access Token

```bash
curl -X POST https://api.codeflow.ai/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "leetcode_username": "your_username",
    "email": "your@email.com",
    "password": "YourSecurePassword123!",
    "language_preference": "en"
  }'
```

**Save the `access_token` from the response!**

### 2. Analyze Your LeetCode Profile

```bash
export TOKEN="your_access_token_here"
export USER_ID="your_user_id_here"

curl -X POST https://api.codeflow.ai/v1/analyze/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"leetcode_username\": \"your_username\"
  }"
```

### 3. Generate Learning Path

```bash
curl -X POST https://api.codeflow.ai/v1/recommendations/generate-path \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"weak_topics\": [\"dynamic-programming\", \"graphs\"],
    \"strong_topics\": [\"arrays\", \"strings\"],
    \"proficiency_level\": \"intermediate\"
  }"
```

### 4. Get Next Problem Recommendation

```bash
curl -X GET "https://api.codeflow.ai/v1/recommendations/next-problem?user_id=$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Chat with AI Mentor

```bash
curl -X POST https://api.codeflow.ai/v1/chat-mentor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"message\": \"How do I approach dynamic programming problems?\"
  }"
```

### 6. Check Your Progress

```bash
curl -X GET "https://api.codeflow.ai/v1/progress/$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Python Quick Start

```python
import requests

BASE_URL = "https://api.codeflow.ai/v1"

# 1. Register
response = requests.post(f"{BASE_URL}/auth/register", json={
    "leetcode_username": "your_username",
    "email": "your@email.com",
    "password": "YourSecurePassword123!",
    "language_preference": "en"
})
data = response.json()
TOKEN = data["access_token"]
USER_ID = data["user_id"]

# 2. Analyze profile
requests.post(
    f"{BASE_URL}/analyze/profile",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={"user_id": USER_ID, "leetcode_username": "your_username"}
)

# 3. Generate learning path
path = requests.post(
    f"{BASE_URL}/recommendations/generate-path",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={
        "user_id": USER_ID,
        "weak_topics": ["dynamic-programming"],
        "proficiency_level": "intermediate"
    }
).json()

# 4. Get next problem
problem = requests.get(
    f"{BASE_URL}/recommendations/next-problem",
    headers={"Authorization": f"Bearer {TOKEN}"},
    params={"user_id": USER_ID}
).json()

print(f"Next problem: {problem['problem']['title']}")
```

---

## JavaScript Quick Start

```javascript
const BASE_URL = "https://api.codeflow.ai/v1";

// 1. Register
const { access_token, user_id } = await fetch(`${BASE_URL}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    leetcode_username: "your_username",
    email: "your@email.com",
    password: "YourSecurePassword123!",
    language_preference: "en"
  })
}).then(r => r.json());

// 2. Analyze profile
await fetch(`${BASE_URL}/analyze/profile`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${access_token}`
  },
  body: JSON.stringify({
    user_id,
    leetcode_username: "your_username"
  })
});

// 3. Get next problem
const problem = await fetch(
  `${BASE_URL}/recommendations/next-problem?user_id=${user_id}`,
  { headers: { "Authorization": `Bearer ${access_token}` }}
).then(r => r.json());

console.log(`Next problem: ${problem.problem.title}`);
```

---

## Common Use Cases

### Use Case 1: Complete Onboarding Flow

```bash
# 1. Register
# 2. Analyze profile
# 3. Generate learning path
# 4. Get first problem
# 5. Start solving!
```

### Use Case 2: Daily Practice Routine

```bash
# 1. Check progress (streak)
# 2. Get next problem
# 3. Solve problem
# 4. Ask mentor for help if stuck
# 5. Get hint if needed
```

### Use Case 3: Debugging Help

```bash
curl -X POST https://api.codeflow.ai/v1/chat-mentor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"message\": \"Why is my solution getting TLE?\",
    \"code\": \"def solve(n):\\n    if n <= 1:\\n        return n\\n    return solve(n-1) + solve(n-2)\",
    \"problem_id\": \"fibonacci-number\"
  }"
```

---

## Rate Limits

- **Authenticated:** 100 requests/minute
- **Anonymous:** 10 requests/minute

## Need Help?

- **Full Documentation:** `infrastructure/docs/API-DOCUMENTATION.md`
- **OpenAPI Spec:** `infrastructure/docs/API-SPECIFICATION.yaml`
- **Swagger UI:** https://editor.swagger.io/ (paste the spec)

---

## Next Steps

1. ✅ Register and get your access token
2. ✅ Analyze your LeetCode profile
3. ✅ Generate your first learning path
4. ✅ Start solving problems!
5. ✅ Chat with the AI mentor when stuck

**Happy coding! 🚀**
