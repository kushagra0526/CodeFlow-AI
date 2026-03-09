# Requirements Document

## Introduction

This document specifies the requirements for integrating the Next.js frontend application with the deployed AWS backend API. The system currently uses mock data for development and testing purposes. This feature will replace all mock data calls with actual API calls to the deployed backend services, enabling real-time data fetching, user authentication, profile analysis, learning path generation, and AI-powered mentoring capabilities.

## Glossary

- **Frontend_Application**: The Next.js web application that provides the user interface
- **Backend_API**: The AWS-deployed REST API accessible via API Gateway that provides all backend services
- **API_Client**: The TypeScript module (frontend/lib/api.ts) that handles HTTP communication with the Backend_API
- **Mock_Data**: Static test data defined in frontend/lib/mock-data.ts used during development
- **Authentication_Token**: JWT token used to authenticate API requests
- **Profile_Analysis**: Analysis of a user's LeetCode submission history to identify strengths and weaknesses
- **Learning_Path**: A personalized sequence of coding problems recommended based on Profile_Analysis
- **Chat_Mentor**: AI-powered conversational assistant that provides coding help and hints using Amazon Nova Lite model
- **Environment_Variable**: Configuration value stored in .env.local that controls application behavior
- **Error_Handler**: Component responsible for catching and displaying API errors to users
- **Loading_State**: UI feedback shown to users while API requests are in progress

## Requirements

### Requirement 1: Remove Mock Data Dependencies

**User Story:** As a developer, I want to remove all mock data from the production build, so that the application only uses real backend data.

#### Acceptance Criteria

1. THE Frontend_Application SHALL remove all imports of Mock_Data from production code
2. THE Frontend_Application SHALL delete the mock-data.ts file after migration is complete
3. WHEN the USE_MOCK_DATA Environment_Variable is false, THE API_Client SHALL make requests only to the Backend_API
4. THE Frontend_Application SHALL not include Mock_Data in the production bundle

### Requirement 2: Configure API Endpoint

**User Story:** As a developer, I want to configure the backend API endpoint via environment variables, so that I can easily switch between development and production environments.

#### Acceptance Criteria

1. THE Frontend_Application SHALL read the Backend_API URL from the NEXT_PUBLIC_API_URL Environment_Variable
2. WHEN NEXT_PUBLIC_API_URL is not set, THE API_Client SHALL use the default production API endpoint
3. THE Frontend_Application SHALL provide an .env.local.example file documenting all required Environment_Variables
4. THE API_Client SHALL validate that the Backend_API URL is a valid HTTPS endpoint

### Requirement 3: Implement Authentication Flow

**User Story:** As a user, I want to securely log in to the application, so that I can access my personalized data.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE API_Client SHALL call the /auth/login endpoint and receive an Authentication_Token
2. WHEN a user registers, THE API_Client SHALL call the /auth/register endpoint and receive an Authentication_Token
3. THE API_Client SHALL store the Authentication_Token in browser localStorage
4. WHEN an Authentication_Token expires, THE API_Client SHALL attempt to refresh it using the /auth/refresh endpoint
5. IF token refresh fails, THEN THE API_Client SHALL clear stored tokens and redirect to the login page
6. THE API_Client SHALL include the Authentication_Token in the Authorization header for all authenticated requests

### Requirement 4: Fetch User Profile Data

**User Story:** As a user, I want to see my LeetCode profile data, so that I can track my progress.

#### Acceptance Criteria

1. WHEN a user logs in, THE Frontend_Application SHALL call the /scraping/fetch-profile endpoint to retrieve LeetCode profile data
2. THE API_Client SHALL send the user_id and leetcode_username in the request body
3. WHEN profile data is received, THE Frontend_Application SHALL display username, problems solved, and topic statistics
4. IF the profile fetch fails, THEN THE Error_Handler SHALL display a user-friendly error message
5. WHILE profile data is loading, THE Frontend_Application SHALL display a Loading_State indicator

### Requirement 5: Display Profile Analysis

**User Story:** As a user, I want to see an analysis of my coding strengths and weaknesses, so that I can focus my learning efforts.

#### Acceptance Criteria

1. WHEN a user views their dashboard, THE Frontend_Application SHALL call the /analyze/profile endpoint to retrieve Profile_Analysis
2. THE Frontend_Application SHALL display topic proficiency scores using the data from Profile_Analysis
3. THE Frontend_Application SHALL categorize topics as weak, moderate, or strong based on the classification field
4. THE Frontend_Application SHALL visualize the proficiency heatmap using the heatmap data structure
5. WHEN Profile_Analysis is unavailable, THE Frontend_Application SHALL prompt the user to fetch their profile first

### Requirement 6: Generate Personalized Learning Paths

**User Story:** As a user, I want to receive a personalized learning path, so that I can improve my weak areas systematically.

#### Acceptance Criteria

1. WHEN a user requests a learning path, THE API_Client SHALL call the /recommendations/generate-path endpoint
2. THE API_Client SHALL send weak_topics, strong_topics, and proficiency_level in the request body
3. WHEN a Learning_Path is received, THE Frontend_Application SHALL display the list of recommended problems
4. THE Frontend_Application SHALL show each problem's title, difficulty, topics, estimated time, and reason for recommendation
5. THE Frontend_Application SHALL allow users to mark problems as completed
6. WHEN generating a Learning_Path fails, THE Error_Handler SHALL display an error message and suggest retrying

### Requirement 7: Integrate AI Chat Mentor

**User Story:** As a user, I want to chat with an AI mentor about coding problems, so that I can get help when I'm stuck.

#### Acceptance Criteria

1. WHEN a user sends a message, THE API_Client SHALL call the /chat-mentor endpoint with the user's message
2. THE API_Client SHALL include optional code and problem_id parameters when provided
3. WHEN a response is received, THE Frontend_Application SHALL display the AI mentor's response in the chat interface
4. THE Frontend_Application SHALL indicate whether the response was cached and display 'nova-lite' as the model used
5. WHILE waiting for a response, THE Frontend_Application SHALL display a Loading_State indicator
6. IF the chat request fails, THEN THE Error_Handler SHALL display an error message without clearing the chat history

### Requirement 8: Track User Progress

**User Story:** As a user, I want to see my daily streak and earned badges, so that I can stay motivated.

#### Acceptance Criteria

1. WHEN a user views their dashboard, THE API_Client SHALL call the /progress/{user_id} endpoint
2. THE Frontend_Application SHALL display the current streak count from the progress data
3. THE Frontend_Application SHALL display all earned badges with their names and earned dates
4. THE Frontend_Application SHALL show problems solved today and total problems solved
5. WHEN next milestone data is available, THE Frontend_Application SHALL display days remaining until the next badge
6. THE Frontend_Application SHALL refresh progress data after a user completes a problem

### Requirement 9: Handle API Errors Gracefully

**User Story:** As a user, I want to see helpful error messages when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN an API request returns a 4xx error, THE Error_Handler SHALL display the error message from the response body
2. WHEN an API request returns a 5xx error, THE Error_Handler SHALL display a generic server error message
3. WHEN a network error occurs, THE Error_Handler SHALL display a connectivity error message
4. IF a 403 error occurs, THEN THE API_Client SHALL clear authentication tokens and redirect to login
5. THE Error_Handler SHALL log all errors to the browser console for debugging purposes
6. THE Frontend_Application SHALL allow users to retry failed requests

### Requirement 10: Implement Request Timeout Handling

**User Story:** As a user, I want requests to timeout if they take too long, so that the application doesn't hang indefinitely.

#### Acceptance Criteria

1. THE API_Client SHALL set a timeout of 30 seconds for all API requests
2. WHEN a request exceeds the timeout, THE API_Client SHALL abort the request
3. WHEN a timeout occurs, THE Error_Handler SHALL display a timeout error message
4. WHERE long-running operations are expected, THE API_Client SHALL use a longer timeout of 60 seconds
5. THE Frontend_Application SHALL allow users to retry timed-out requests

### Requirement 11: Implement Loading States

**User Story:** As a user, I want to see loading indicators during API calls, so that I know the application is working.

#### Acceptance Criteria

1. WHEN an API request is initiated, THE Frontend_Application SHALL display a Loading_State indicator
2. WHEN an API request completes, THE Frontend_Application SHALL hide the Loading_State indicator
3. THE Frontend_Application SHALL disable action buttons while requests are in progress
4. WHERE multiple requests are in progress, THE Frontend_Application SHALL show a global loading indicator
5. THE Loading_State SHALL include a spinner or progress animation

### Requirement 12: Cache API Responses

**User Story:** As a user, I want frequently accessed data to load quickly, so that the application feels responsive.

#### Acceptance Criteria

1. WHERE appropriate, THE API_Client SHALL cache GET request responses in memory
2. THE API_Client SHALL set a cache expiration time of 5 minutes for profile data
3. THE API_Client SHALL set a cache expiration time of 10 minutes for topic analysis data
4. WHEN cached data is available and not expired, THE API_Client SHALL return cached data without making a network request
5. THE API_Client SHALL invalidate cached data when related mutations occur
6. THE Frontend_Application SHALL provide a manual refresh option to bypass the cache

### Requirement 13: Implement Request Retry Logic

**User Story:** As a developer, I want failed requests to be automatically retried, so that transient network issues don't break the user experience.

#### Acceptance Criteria

1. WHEN an API request fails with a 5xx error, THE API_Client SHALL retry the request up to 3 times
2. THE API_Client SHALL use exponential backoff between retry attempts (1s, 2s, 4s)
3. WHEN a request fails with a 4xx error, THE API_Client SHALL not retry the request
4. WHEN all retry attempts fail, THE Error_Handler SHALL display an error message
5. THE API_Client SHALL not retry requests that modify data (POST, PUT, DELETE) to avoid duplicate operations

### Requirement 14: Validate API Response Data

**User Story:** As a developer, I want to validate API responses against expected schemas, so that invalid data doesn't cause runtime errors.

#### Acceptance Criteria

1. THE API_Client SHALL validate that required fields are present in API responses
2. WHEN a response is missing required fields, THE API_Client SHALL throw a validation error
3. THE API_Client SHALL validate that field types match expected TypeScript interfaces
4. WHEN validation fails, THE Error_Handler SHALL log the validation error and display a generic error message
5. THE API_Client SHALL provide type-safe response objects to consuming components

### Requirement 15: Support Offline Mode Detection

**User Story:** As a user, I want to be notified when I'm offline, so that I understand why API calls are failing.

#### Acceptance Criteria

1. THE Frontend_Application SHALL detect when the browser is offline using the navigator.onLine API
2. WHEN the browser goes offline, THE Frontend_Application SHALL display an offline notification banner
3. WHEN the browser comes back online, THE Frontend_Application SHALL hide the offline notification
4. WHILE offline, THE API_Client SHALL not attempt to make network requests
5. WHEN the browser comes back online, THE Frontend_Application SHALL retry any pending requests

