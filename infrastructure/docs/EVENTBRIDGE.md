# EventBridge Configuration

## Overview

This document describes the EventBridge event bus and rules configured for the CodeFlow AI platform. EventBridge enables asynchronous event-driven architecture for background processing and workflow orchestration.

## Event Bus

**Name:** `codeflow-events-{environment}`

The custom event bus handles all CodeFlow application events, separating them from the default AWS event bus for better organization and security.

## Event Patterns

### 1. Profile Analysis Complete

**Event Pattern:**
```json
{
  "source": ["codeflow.analysis"],
  "detailType": ["ProfileAnalysisComplete"]
}
```

**Targets:**
- **SQS Queue** (`codeflow-background-jobs`): Queues the event for ECS Fargate task processing
- **ECS Task** (to be added in task 1.8): Triggers weakness analysis worker

**Use Case:** When a user's LeetCode profile analysis completes, this event triggers heavy AI workloads for deep pattern analysis and learning gap identification.

**Event Payload Example:**
```json
{
  "version": "0",
  "id": "event-id",
  "detail-type": "ProfileAnalysisComplete",
  "source": "codeflow.analysis",
  "account": "123456789012",
  "time": "2024-01-15T10:30:00Z",
  "region": "us-east-1",
  "resources": [],
  "detail": {
    "user_id": "user-123",
    "leetcode_username": "john_doe",
    "total_problems": 150,
    "weak_topics": ["dynamic-programming", "graphs"],
    "strong_topics": ["arrays", "strings"],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Learning Path Requested

**Event Pattern:**
```json
{
  "source": ["codeflow.learning"],
  "detailType": ["LearningPathRequested"]
}
```

**Targets:**
- **Lambda Function** (`codeflow-recommendations`): Generates personalized learning path using Bedrock

**Use Case:** When a user requests a new learning path, this event triggers the recommendations Lambda to generate a 20-30 problem sequence using Claude 3 Sonnet.

**Event Payload Example:**
```json
{
  "version": "0",
  "id": "event-id",
  "detail-type": "LearningPathRequested",
  "source": "codeflow.learning",
  "account": "123456789012",
  "time": "2024-01-15T10:35:00Z",
  "region": "us-east-1",
  "resources": [],
  "detail": {
    "user_id": "user-123",
    "weak_topics": ["dynamic-programming", "graphs"],
    "strong_topics": ["arrays", "strings"],
    "user_level": "intermediate",
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

### 3. Problem Completed

**Event Pattern:**
```json
{
  "source": ["codeflow.progress"],
  "detailType": ["ProblemCompleted"]
}
```

**Targets:**
- **Lambda Function** (`codeflow-analysis`): Updates user progress and streak
- **SQS Queue** (`codeflow-background-jobs`): Queues analytics aggregation job

**Use Case:** When a user completes a problem, this event triggers progress tracking updates and analytics aggregation for dashboards.

**Event Payload Example:**
```json
{
  "version": "0",
  "id": "event-id",
  "detail-type": "ProblemCompleted",
  "source": "codeflow.progress",
  "account": "123456789012",
  "time": "2024-01-15T11:00:00Z",
  "region": "us-east-1",
  "resources": [],
  "detail": {
    "user_id": "user-123",
    "problem_id": "two-sum",
    "difficulty": "easy",
    "topic": "arrays",
    "success": true,
    "time_taken_seconds": 1200,
    "timestamp": "2024-01-15T11:00:00Z"
  }
}
```

### 4. Daily Sync Scheduled

**Schedule:** `cron(0 2 * * ? *)` (2 AM UTC daily)

**Targets:**
- **Lambda Function** (`codeflow-scraping`): Syncs LeetCode data for all active users

**Use Case:** Daily scheduled job to refresh user profiles, submission history, and problem metadata from LeetCode's public API.

## SQS Queues

### Background Jobs Queue

**Name:** `codeflow-background-jobs-{environment}`

**Configuration:**
- **Queue Type:** Standard
- **Visibility Timeout:** 15 minutes (for heavy ECS processing)
- **Message Retention:** 4 days
- **Receive Message Wait Time:** 20 seconds (long polling)
- **Encryption:** SQS-managed (SSE-SQS)

**Job Types:**
- Heavy profile analysis (ECS consumer)
- Bulk LeetCode sync (Lambda consumer)
- Weekly email reports (Lambda consumer)
- Analytics aggregation (Lambda consumer)

### Dead Letter Queue

**Name:** `codeflow-dlq-{environment}`

**Configuration:**
- **Message Retention:** 14 days
- **Max Receive Count:** 3 (messages move to DLQ after 3 failed processing attempts)
- **Encryption:** SQS-managed (SSE-SQS)

**Monitoring:** CloudWatch alarms should be configured to alert when messages appear in the DLQ.

## Event Publishing from Lambda

Lambda functions can publish events to the event bus using the AWS SDK:

```python
import boto3
import json
import os

events_client = boto3.client('events')
event_bus_name = os.environ['EVENT_BUS_NAME']

def publish_profile_analysis_complete(user_id, leetcode_username, weak_topics, strong_topics):
    """Publish ProfileAnalysisComplete event to EventBridge."""
    response = events_client.put_events(
        Entries=[
            {
                'Source': 'codeflow.analysis',
                'DetailType': 'ProfileAnalysisComplete',
                'Detail': json.dumps({
                    'user_id': user_id,
                    'leetcode_username': leetcode_username,
                    'weak_topics': weak_topics,
                    'strong_topics': strong_topics,
                    'timestamp': datetime.utcnow().isoformat()
                }),
                'EventBusName': event_bus_name
            }
        ]
    )
    return response
```

## Retry and Error Handling

### Lambda Targets

- **Max Event Age:** 1-6 hours (depending on criticality)
- **Retry Attempts:** 2-3 attempts
- **Dead Letter Queue:** Failed events are sent to `codeflow-dlq`

### SQS Targets

- **Visibility Timeout:** 15 minutes (allows ECS tasks to process)
- **Max Receive Count:** 3 (after 3 failed attempts, message moves to DLQ)
- **Dead Letter Queue:** `codeflow-dlq`

## Permissions

### Lambda Functions

Lambda functions have been granted the following permissions:

1. **Publish Events to EventBridge:**
   - `events:PutEvents` on `codeflow-events-{environment}`

2. **Send Messages to SQS:**
   - `sqs:SendMessage` on `codeflow-background-jobs-{environment}`

### EventBridge Rules

EventBridge rules have been granted:

1. **Invoke Lambda Functions:**
   - `lambda:InvokeFunction` on target Lambda functions

2. **Send Messages to SQS:**
   - `sqs:SendMessage` on `codeflow-background-jobs-{environment}` and `codeflow-dlq-{environment}`

## Monitoring

### CloudWatch Metrics

Monitor the following metrics:

1. **EventBridge:**
   - `Invocations`: Number of times rules are triggered
   - `FailedInvocations`: Number of failed rule invocations
   - `TriggeredRules`: Number of rules triggered

2. **SQS:**
   - `ApproximateNumberOfMessagesVisible`: Messages in queue
   - `ApproximateAgeOfOldestMessage`: Age of oldest message
   - `NumberOfMessagesSent`: Messages sent to queue
   - `NumberOfMessagesReceived`: Messages received from queue
   - `NumberOfMessagesDeleted`: Messages successfully processed

3. **Dead Letter Queue:**
   - `ApproximateNumberOfMessagesVisible`: Failed messages (should be 0)

### CloudWatch Alarms

Recommended alarms:

1. **DLQ Messages:** Alert when `ApproximateNumberOfMessagesVisible` > 0 in DLQ
2. **Queue Depth:** Alert when `ApproximateNumberOfMessagesVisible` > 100 in background jobs queue
3. **Old Messages:** Alert when `ApproximateAgeOfOldestMessage` > 1 hour
4. **Failed Invocations:** Alert when `FailedInvocations` > 5 in 5 minutes

## Testing

### Publish Test Event

Use AWS CLI to publish a test event:

```bash
aws events put-events \
  --entries '[
    {
      "Source": "codeflow.analysis",
      "DetailType": "ProfileAnalysisComplete",
      "Detail": "{\"user_id\":\"test-user\",\"leetcode_username\":\"test\",\"weak_topics\":[\"dp\"],\"strong_topics\":[\"arrays\"]}",
      "EventBusName": "codeflow-events-dev"
    }
  ]'
```

### Monitor Event Delivery

Check CloudWatch Logs for target Lambda functions to verify event delivery and processing.

## Future Enhancements

1. **Event Archive:** Enable EventBridge event archive for replay capability
2. **Event Replay:** Implement event replay for failed processing scenarios
3. **Schema Registry:** Define event schemas in EventBridge Schema Registry
4. **Cross-Account Events:** Enable cross-account event delivery for multi-account architectures
5. **Event Filtering:** Add more granular event filtering based on event attributes

## References

- [AWS EventBridge Documentation](https://docs.aws.amazon.com/eventbridge/)
- [EventBridge Event Patterns](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html)
- [SQS Dead Letter Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
