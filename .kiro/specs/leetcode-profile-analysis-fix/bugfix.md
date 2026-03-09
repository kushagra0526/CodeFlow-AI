# Bugfix Requirements Document

## Introduction

After a user logs in with their LeetCode username, the automatic profile analysis is triggered but fails to show personalized data (roadmap, heatmap, topic proficiency). Instead, the dashboard displays mock/fallback data. The root cause is that the profile analysis Lambda expects cached LeetCode data in DynamoDB, but the scraping service is never invoked to fetch this data first. This creates a critical gap in the data pipeline where analysis runs on empty data, resulting in no personalized learning recommendations for users.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user logs in with their LeetCode username THEN the system calls `analyzeProfile()` which triggers the analysis Lambda without first fetching LeetCode profile data

1.2 WHEN the analysis Lambda (`/analyze/profile`) executes THEN it finds no cached profile data in DynamoDB and returns empty/mock data

1.3 WHEN the dashboard loads after login THEN it displays mock/fallback data instead of the user's real LeetCode statistics, roadmap, and heatmap

1.4 WHEN the scraping service exists and is functional THEN it is never invoked during the login flow, leaving the data pipeline incomplete

### Expected Behavior (Correct)

2.1 WHEN a user logs in with their LeetCode username THEN the system SHALL first invoke the scraping service to fetch and cache the user's LeetCode profile data

2.2 WHEN the scraping service completes successfully THEN the system SHALL invoke the analysis Lambda to process the cached profile data

2.3 WHEN the analysis Lambda executes THEN it SHALL find cached LeetCode data in DynamoDB and generate personalized topic proficiency, weak areas, and recommendations

2.4 WHEN the dashboard loads after successful analysis THEN it SHALL display the user's real LeetCode heatmap, personalized roadmap, and topic proficiency based on their actual submission history

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user logs in with valid credentials THEN the system SHALL CONTINUE TO authenticate successfully and create a session

3.2 WHEN the scraping service is called for a valid LeetCode username THEN it SHALL CONTINUE TO fetch profile data and cache it in DynamoDB as designed

3.3 WHEN the analysis Lambda receives cached profile data THEN it SHALL CONTINUE TO generate accurate topic proficiency and weakness analysis

3.4 WHEN a user navigates to other dashboard pages (interview, mentor) THEN those features SHALL CONTINUE TO function independently of the profile analysis

3.5 WHEN the API returns mock/fallback data due to errors THEN the system SHALL CONTINUE TO handle gracefully without crashing
