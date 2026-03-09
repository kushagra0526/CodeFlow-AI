# LeetCode Profile Analysis Fix - Bugfix Design

## Overview

The profile analysis flow is broken because it skips the critical data fetching step. When users log in, the frontend immediately calls the analysis Lambda (`/analyze/profile`), which expects cached LeetCode data in DynamoDB. However, the scraping service (`/scraping/fetch-profile`) is never invoked to fetch and cache this data first. This creates a data pipeline gap where analysis runs on empty data, returning 404 errors or mock/fallback data instead of personalized learning recommendations.

The fix requires modifying the frontend's `auth-context.tsx` to call the scraping service before calling the analysis service, ensuring the data pipeline flows correctly: Login → Scrape → Cache → Analyze → Display.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user logs in and profile analysis is triggered without first fetching LeetCode data
- **Property (P)**: The desired behavior - scraping service must be called before analysis to populate the cache
- **Preservation**: Existing authentication, error handling, and non-blocking analysis behavior must remain unchanged
- **analyzeProfile()**: The API method in `frontend/lib/api.ts` that calls `/analyze/profile` endpoint
- **Scraping Service**: The Lambda function at `/scraping/fetch-profile` that fetches LeetCode data and caches it in DynamoDB
- **Analysis Lambda**: The Lambda function at `/analyze/profile` that processes cached profile data to generate topic proficiency
- **auth-context.tsx**: The React context in `frontend/lib/auth-context.tsx` that manages authentication and triggers profile analysis

## Bug Details

### Fault Condition

The bug manifests when a user successfully logs in or registers with their LeetCode username. The `login()` or `register()` function in `auth-context.tsx` immediately calls `api.analyzeProfile()`, which invokes the analysis Lambda. The analysis Lambda expects to find cached LeetCode profile data in the DynamoDB Users table (stored under the `leetcode_profile` attribute), but this data doesn't exist because the scraping service was never called to fetch it.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: 'login' | 'register', user_id: string, leetcode_username: string }
  OUTPUT: boolean
  
  RETURN input.action IN ['login', 'register']
         AND scrapingServiceCalled(input.user_id, input.leetcode_username) == false
         AND analysisServiceCalled(input.user_id, input.leetcode_username) == true
         AND cachedProfileDataExists(input.user_id) == false
END FUNCTION
```

### Examples

- **Login Scenario**: User logs in with username "john_doe" → `auth-context.tsx` calls `api.analyzeProfile("user123", "john_doe")` → Analysis Lambda queries DynamoDB for user123's profile → No `leetcode_profile` data found → Returns 404 error "Profile not found. Please sync with LeetCode first." → Dashboard displays mock data

- **Registration Scenario**: User registers with username "jane_smith" → `auth-context.tsx` calls `api.analyzeProfile("user456", "jane_smith")` → Analysis Lambda finds no cached data → Returns empty analysis → Dashboard shows fallback topic data instead of real LeetCode statistics

- **Expected Behavior**: User logs in with username "john_doe" → `auth-context.tsx` first calls scraping service → Scraping service fetches LeetCode data and caches in DynamoDB → Then calls analysis service → Analysis Lambda finds cached data → Returns personalized topic proficiency → Dashboard displays real heatmap and roadmap

- **Edge Case - Scraping Failure**: User logs in → Scraping service is called but LeetCode API fails → Error is caught and logged → Analysis is skipped (non-blocking) → User can still access dashboard with mock data

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Authentication flow must continue to work exactly as before (login/register creates session and JWT tokens)
- Non-blocking error handling must remain - if scraping or analysis fails, login should still succeed
- Dashboard must continue to display mock/fallback data gracefully when real data is unavailable
- Other dashboard features (interview simulator, chat mentor) must remain unaffected
- API error responses and CORS headers must remain unchanged

**Scope:**
All inputs that do NOT involve the login/register flow should be completely unaffected by this fix. This includes:
- Manual profile sync operations (if they exist)
- Direct API calls to scraping or analysis services
- Dashboard data fetching after initial login
- Token refresh and session management
- Navigation between dashboard pages

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Missing Scraping Service Call**: The `auth-context.tsx` file's `login()` and `register()` functions call `api.analyzeProfile()` directly without first calling a scraping service endpoint to fetch and cache LeetCode data.

2. **Incorrect Service Orchestration**: The frontend assumes that profile data is already cached when analysis is triggered, but there's no mechanism to populate this cache during the login flow.

3. **Missing API Method**: The `frontend/lib/api.ts` file likely doesn't have a method to call the scraping service (`/scraping/fetch-profile` endpoint), or if it exists, it's not being used in the auth flow.

4. **Data Pipeline Gap**: The intended flow is: Scrape → Cache → Analyze, but the current implementation skips directly to Analyze, causing the analysis Lambda to find no data and return errors or empty results.

## Correctness Properties

Property 1: Fault Condition - Scraping Before Analysis

_For any_ login or registration action where a user provides a LeetCode username, the fixed auth flow SHALL first invoke the scraping service to fetch and cache the user's LeetCode profile data, and only after successful caching (or acceptable failure) SHALL it invoke the analysis service to process that cached data.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Authentication and Error Handling

_For any_ login or registration action, the fixed code SHALL produce the same authentication behavior as the original code (successful session creation, JWT token storage, user state management), and SHALL maintain non-blocking error handling where scraping or analysis failures do not prevent successful login.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `frontend/lib/api.ts`

**Changes**:
1. **Add Scraping Service Method**: Add a new method `fetchProfile(user_id: string, leetcode_username: string)` that calls the `/scraping/fetch-profile` endpoint to fetch and cache LeetCode data.

**File**: `frontend/lib/auth-context.tsx`

**Function**: `login()` and `register()`

**Specific Changes**:
1. **Add Scraping Call Before Analysis**: After successful authentication, call `api.fetchProfile()` to fetch and cache LeetCode data before calling `api.analyzeProfile()`.

2. **Sequential Service Calls**: Ensure scraping completes (or fails gracefully) before analysis is triggered:
   ```typescript
   // First: Fetch and cache LeetCode data
   await api.fetchProfile(user.user_id, user.leetcode_username)
   
   // Then: Analyze the cached data
   await api.analyzeProfile(user.user_id, user.leetcode_username)
   ```

3. **Error Handling**: Maintain non-blocking behavior - if scraping fails, log the error but don't block login. Analysis may still be called (it will handle missing data gracefully).

4. **Logging**: Add console logs to track the data pipeline flow for debugging.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (analysis called without scraping), then verify the fix works correctly (scraping called before analysis) and preserves existing behavior (authentication still works, errors are non-blocking).

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the analysis Lambda is called without the scraping service being invoked first, resulting in 404 errors or empty data.

**Test Plan**: Monitor network requests during login/registration on the UNFIXED code. Verify that only `/analyze/profile` is called, not `/scraping/fetch-profile`. Check DynamoDB to confirm no `leetcode_profile` data exists. Observe the 404 error or mock data response.

**Test Cases**:
1. **Login Without Scraping**: Log in with valid credentials → Observe network tab shows only `/auth/login` and `/analyze/profile` calls → No `/scraping/fetch-profile` call → Analysis returns 404 (will fail on unfixed code)

2. **Registration Without Scraping**: Register new account → Observe network tab shows only `/auth/register` and `/analyze/profile` calls → No scraping call → Dashboard shows mock data (will fail on unfixed code)

3. **DynamoDB Cache Check**: After login on unfixed code → Query DynamoDB Users table for user's `leetcode_profile` attribute → Confirm it doesn't exist or is empty (will fail on unfixed code)

4. **Analysis Lambda Logs**: Check CloudWatch logs for analysis Lambda → Observe "Profile not found" error messages → Confirm it's looking for cached data that doesn't exist (will fail on unfixed code)

**Expected Counterexamples**:
- Network requests show analysis is called but scraping is not
- DynamoDB has no cached LeetCode profile data for the user
- Analysis Lambda returns 404 "Profile not found. Please sync with LeetCode first."
- Dashboard displays mock/fallback data instead of real user statistics

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (login/register actions), the fixed function produces the expected behavior (scraping called before analysis).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := login_fixed(input.leetcode_username, input.password)
  ASSERT scrapingServiceCalled(input.user_id, input.leetcode_username) == true
  ASSERT scrapingCalledBeforeAnalysis() == true
  ASSERT cachedProfileDataExists(input.user_id) == true
  ASSERT analysisServiceCalled(input.user_id, input.leetcode_username) == true
  ASSERT dashboardShowsRealData() == true
END FOR
```

**Test Cases**:
1. **Login With Scraping**: Log in with valid credentials → Verify network tab shows `/scraping/fetch-profile` called before `/analyze/profile` → Check DynamoDB has cached profile data → Verify dashboard shows real LeetCode statistics

2. **Registration With Scraping**: Register new account → Verify scraping service is called → Verify analysis service is called after scraping → Check dashboard displays personalized roadmap

3. **Service Call Order**: Use network request timestamps to verify scraping completes before analysis starts

4. **Data Pipeline Verification**: After login → Query DynamoDB → Confirm `leetcode_profile` data exists → Verify analysis used this data (check response contains real topic proficiency)

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (non-login flows, error scenarios), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT login_original(input) = login_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it generates many test cases automatically and catches edge cases that manual tests might miss.

**Test Plan**: Test the UNFIXED code first to observe baseline behavior for authentication, error handling, and dashboard features. Then verify the FIXED code maintains this behavior.

**Test Cases**:
1. **Authentication Preservation**: Verify login still creates JWT tokens, stores user data in localStorage, and redirects to dashboard correctly after fix

2. **Error Handling Preservation**: Test login with invalid credentials → Verify error messages are unchanged → Test scraping service failure → Verify login still succeeds (non-blocking)

3. **Dashboard Features Preservation**: After login, navigate to interview simulator and chat mentor pages → Verify they work exactly as before

4. **Token Refresh Preservation**: Test token refresh flow → Verify it works unchanged

5. **Logout Preservation**: Test logout functionality → Verify tokens are cleared and user is redirected correctly

### Unit Tests

- Test `api.fetchProfile()` method calls the correct endpoint with correct parameters
- Test `auth-context.tsx` login flow calls scraping before analysis
- Test error handling when scraping service fails (should be non-blocking)
- Test error handling when analysis service fails (should be non-blocking)
- Mock API responses to test different scenarios (success, scraping failure, analysis failure)

### Property-Based Tests

- Generate random valid LeetCode usernames and verify scraping is always called before analysis
- Generate random error scenarios (network failures, API errors) and verify login remains non-blocking
- Test that authentication tokens are always created regardless of scraping/analysis success
- Verify dashboard always displays some data (real or fallback) after login

### Integration Tests

- Full login flow: Enter credentials → Submit → Verify scraping called → Verify analysis called → Verify dashboard shows real data
- Full registration flow: Enter details → Submit → Verify scraping called → Verify analysis called → Verify dashboard shows personalized roadmap
- Error recovery flow: Login → Scraping fails → Verify error logged → Verify login succeeds → Verify dashboard shows fallback data
- Data persistence: Login → Logout → Login again → Verify cached data is reused (scraping may be skipped if data is fresh)
