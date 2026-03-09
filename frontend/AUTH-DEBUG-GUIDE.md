# Authentication Debugging Guide

## Problem Summary
User is logged in (shows "Welcome back, CVBJS5YTAX!") but all API requests return **403 Forbidden** errors. The dashboard falls back to mock data showing incorrect stats (42 problems instead of real 1 problem).

## Root Cause Analysis

### JWT Secret Configuration
Both the auth Lambda and JWT authorizer Lambda are using the same placeholder secret:
- **Auth Lambda**: `JWT_SECRET = 'PLACEHOLDER_JWT_SECRET'`
- **JWT Authorizer Lambda**: `JWT_SECRET = 'PLACEHOLDER_JWT_SECRET'`

This is correct - they match. However, we need to verify:
1. The tokens are being generated correctly by the auth Lambda
2. The tokens are being sent correctly by the frontend
3. The JWT authorizer is validating them correctly

## Changes Made

### 1. Added Debug Logging to API Client (`frontend/lib/api.ts`)
- Logs every API request with method, URL, and token status
- Logs Authorization header being added
- Logs response status for every request
- Shows first 20 characters of token for verification

### 2. Removed Mock Data Fallback (`frontend/app/dashboard/page.tsx`)
- Dashboard now shows real errors instead of silently falling back to mock data
- Users will see actual error messages when API calls fail

### 3. Created Auth Debug Tool (`frontend/TEST-AUTH-DEBUG.html`)
A standalone HTML page that:
- Shows all localStorage contents (access_token, refresh_token, user)
- Decodes and analyzes JWT tokens
- Shows token expiration status
- Provides buttons to test API endpoints directly
- Shows full request/response details

## Debugging Steps

### Step 1: Check Browser Console
1. Open the frontend at `http://localhost:3000`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for `[API]` log messages showing:
   - Request details
   - Token status
   - Response status

### Step 2: Use Auth Debug Tool
1. Open `http://localhost:3000/TEST-AUTH-DEBUG.html` in your browser
2. Check the **LocalStorage Contents** section:
   - Verify `access_token` exists
   - Verify `refresh_token` exists
   - Verify `user` object has `user_id` and `leetcode_username`
3. Check the **JWT Token Analysis** section:
   - Verify token is not expired
   - Check payload contains `user_id`, `leetcode_username`, `token_type: 'access'`
   - Verify token algorithm is `HS256`
4. Click **Test GET /progress/{user_id}** button:
   - If 403: Token validation is failing
   - If 200: Token is valid, issue is elsewhere
   - Check response body for error details

### Step 3: Check Backend Logs
If tokens are being sent correctly but still getting 403:

```bash
# Check JWT authorizer Lambda logs
aws logs tail /aws/lambda/codeflow-jwt-authorizer-dev --follow

# Check auth Lambda logs
aws logs tail /aws/lambda/codeflow-auth-dev --follow
```

Look for:
- "No token found in request"
- "Invalid token type"
- "Token has expired"
- "Invalid token: ..."
- "Authorization successful for user: ..."

## Common Issues and Solutions

### Issue 1: Token Expired
**Symptoms**: Token analysis shows "EXPIRED"
**Solution**: Log out and log back in to get a new token

### Issue 2: Token Not Being Sent
**Symptoms**: Console shows "No access token available for: /progress/..."
**Solution**: Check if `localStorage.getItem('access_token')` returns a value

### Issue 3: Token Format Invalid
**Symptoms**: JWT authorizer logs show "Invalid token format"
**Solution**: Check if token has 3 parts separated by dots (header.payload.signature)

### Issue 4: JWT Secret Mismatch
**Symptoms**: JWT authorizer logs show "Invalid token: Signature verification failed"
**Solution**: Verify both Lambdas use the same JWT_SECRET environment variable

### Issue 5: Authorizer Not Attached
**Symptoms**: All protected endpoints return 403 without calling authorizer
**Solution**: Verify API Gateway methods have `authorizer: this.jwtAuthorizer` configured

## Next Steps

1. **Immediate**: Check browser console and auth debug tool
2. **If token is valid**: Check backend Lambda logs for authorizer errors
3. **If token is invalid**: Re-login to get a new token
4. **If still failing**: Check API Gateway configuration and authorizer attachment

## Testing Checklist

- [ ] Browser console shows `[API]` logs with token being sent
- [ ] Auth debug tool shows valid (not expired) token
- [ ] Token payload contains `user_id`, `leetcode_username`, `token_type: 'access'`
- [ ] Test API button returns 200 (not 403)
- [ ] JWT authorizer logs show "Authorization successful"
- [ ] Dashboard loads real data (not mock data)

## Files Modified

1. `frontend/lib/api.ts` - Added debug logging
2. `frontend/app/dashboard/page.tsx` - Removed mock data fallback
3. `frontend/TEST-AUTH-DEBUG.html` - Created debug tool
4. `frontend/AUTH-DEBUG-GUIDE.md` - This guide

## Backend Configuration Reference

### JWT Authorizer Lambda
- **Function**: `codeflow-jwt-authorizer-dev`
- **Location**: `lambda-functions/jwt-authorizer/index.py`
- **Environment**: `JWT_SECRET = 'PLACEHOLDER_JWT_SECRET'`
- **Algorithm**: `HS256`

### Auth Lambda
- **Function**: `codeflow-auth-dev`
- **Location**: `lambda-functions/auth/index.py`
- **Environment**: `JWT_SECRET = 'PLACEHOLDER_JWT_SECRET'`
- **Algorithm**: `HS256`

### API Gateway
- **API**: `codeflow-api-dev`
- **Authorizer**: `jwt-authorizer` (RequestAuthorizer)
- **Identity Source**: `Authorization` header
- **Cache TTL**: 5 minutes

## Expected Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "abc123...",
    "leetcode_username": "CVBJS5YTAX",
    "token_type": "access",
    "exp": 1234567890,
    "iat": 1234567890
  }
}
```

## Contact Points

If debugging reveals:
- **Frontend issue**: Check `frontend/lib/api.ts` and `frontend/lib/auth-context.tsx`
- **Backend issue**: Check `lambda-functions/jwt-authorizer/index.py`
- **Infrastructure issue**: Check `infrastructure/lib/codeflow-infrastructure-stack.ts` (lines 900-1060)
