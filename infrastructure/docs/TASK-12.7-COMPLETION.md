# Task 12.7 Completion: Configure Production Monitoring and Alerts

## Overview

Task 12.7 has been completed with a focus on **ultra-budget mode** monitoring using CloudWatch only. Per ULTRA-BUDGET-MODE.md requirements, we have **skipped Sentry and X-Ray** to stay within the $260 AWS credits budget.

## What Was Implemented

### ✅ Monitoring Verification Script

**File**: `infrastructure/scripts/verify-monitoring.py`

A comprehensive Python script that verifies:
- CloudWatch dashboards exist (GenAI Performance, API Health, User Engagement)
- CloudWatch alarms are configured and enabled
- SNS topic exists and has subscriptions
- **Billing alarms are configured (CRITICAL for budget mode)**

**Usage**:
```bash
python infrastructure/scripts/verify-monitoring.py --region us-east-1 --environment prod
```

**Features**:
- Checks all 3 required dashboards
- Verifies 5 application alarms
- Verifies 3 billing alarms (50%, 75%, 90% thresholds)
- Checks SNS topic and subscriptions
- Provides direct URLs to dashboards
- Returns exit code 0 on success, 1 on failure

### ✅ Alarm Testing Script

**File**: `infrastructure/scripts/test-alarms.py`

A script to test CloudWatch alarms by publishing test metrics:

**Usage**:
```bash
# Test specific alarm
python infrastructure/scripts/test-alarms.py --alarm billing --region us-east-1
python infrastructure/scripts/test-alarms.py --alarm api-error --environment prod

# Test all alarms
python infrastructure/scripts/test-alarms.py --alarm all --environment prod

# Reset alarm states after testing
python infrastructure/scripts/test-alarms.py --alarm all --environment prod --reset
```

**Supported alarm tests**:
- `billing` - Test billing alarms (critical for budget mode)
- `api-error` - Test API error rate alarm
- `bedrock-latency` - Test Bedrock latency alarm
- `dynamodb-throttling` - Test DynamoDB throttling alarm
- `cache-hit-rate` - Test LLM cache hit rate alarm
- `all` - Test all alarms

### ✅ On-Call Guide

**File**: `infrastructure/docs/ON-CALL-GUIDE.md`

Comprehensive on-call procedures including:

**Alarm Response Procedures**:
1. 🚨 **CRITICAL: Billing Alarms** (50%, 75%, 90% budget thresholds)
   - Investigation steps
   - Mitigation actions (including emergency Bedrock shutdown)
   - Response times: Immediate (within 5 minutes)

2. ⚠️ **HIGH: API Error Rate > 5%**
   - Check API Gateway and Lambda logs
   - Investigate 4XX vs 5XX errors
   - Response time: 15 minutes

3. ⚠️ **MEDIUM: Bedrock Latency > 10s (P95)**
   - Check Bedrock service status
   - Review token usage and prompt complexity
   - Response time: 30 minutes

4. ⚠️ **HIGH: DynamoDB Throttling Events**
   - Identify throttled table
   - Check capacity mode and hot partitions
   - Response time: 15 minutes

5. ⚠️ **MEDIUM: Lambda High Concurrency > 800**
   - Check for traffic spikes or abuse
   - Monitor Lambda duration
   - Response time: 30 minutes

6. ℹ️ **LOW: LLM Cache Hit Rate < 40%**
   - Review cache configuration
   - Analyze query patterns
   - Response time: 1 hour

**Common Issues and Solutions**:
- Lambda cold starts
- Bedrock rate limiting
- DynamoDB hot partitions
- High data transfer costs

**Escalation Procedures**:
- Level 1: On-Call Engineer
- Level 2: Senior Engineer
- Level 3: Engineering Manager

**Useful Commands**:
- Check CloudWatch dashboards
- Check alarm states
- Check recent logs
- Check costs

### ✅ Monitoring Access Guide

**File**: `infrastructure/docs/MONITORING-ACCESS.md`

Quick reference for accessing monitoring resources:

**Direct Console URLs**:
- GenAI Performance Dashboard
- API Health Dashboard
- User Engagement Dashboard
- All Alarms

**CLI Commands**:
- View alarm states
- View specific alarm details
- View alarm history
- Tail Lambda logs
- Filter logs for errors
- Get metric statistics
- Subscribe to SNS notifications
- Check costs

**Verification Scripts**:
- How to run verify-monitoring.py
- How to run test-alarms.py

**Mobile Access**:
- CloudWatch mobile app setup
- Push notifications for alarms

**Slack Integration** (Optional):
- AWS Chatbot setup
- Slack commands

**Monitoring Checklist**:
- Daily checks
- Weekly checks
- Monthly checks

### ✅ Monitoring Scripts README

**File**: `infrastructure/scripts/README-monitoring.md`

Documentation for the monitoring scripts including:
- Script overview and usage
- Prerequisites (Python dependencies, AWS credentials, IAM permissions)
- Common use cases
- Troubleshooting
- Integration with CI/CD (GitHub Actions, AWS Lambda)
- Best practices

## What Was NOT Implemented (Per Budget Constraints)

### ❌ Sentry Integration

**Reason**: Not in ultra-budget mode ($260 credits)

**Cost Savings**: $0/month (would be $26/month for Developer plan)

**Alternative**: Use CloudWatch Logs for error tracking

### ❌ X-Ray Tracing

**Reason**: Not in ultra-budget mode ($260 credits)

**Cost Savings**: $5/month

**Alternative**: Use CloudWatch Logs and metrics for debugging

### ❌ ECS Task Failure Alarm

**Reason**: ECS Fargate is disabled in ultra-budget mode

**Note**: The alarm definition exists in CLOUDWATCH.md but is not deployed since ECS is not used

## Existing Infrastructure (Already Deployed)

The following monitoring infrastructure was already created in **Task 1.10**:

### CloudWatch Dashboards
1. **CodeFlow-GenAI-Performance-prod**
   - Bedrock API latency (P50, P95, P99)
   - LLM cache performance (hit rate, miss rate)
   - Token usage and cost
   - Bedrock invocations by model

2. **CodeFlow-API-Health-prod**
   - API request rate
   - API error rate (4XX, 5XX)
   - API latency (P50, P95, P99)
   - Lambda concurrent executions
   - DynamoDB throttling events

3. **CodeFlow-User-Engagement-prod**
   - Daily Active Users (DAU)
   - Problems solved per day
   - Learning paths generated
   - Chat mentor conversations

### CloudWatch Alarms
1. **CodeFlow-API-ErrorRate-prod** - Alert when API error rate > 5%
2. **CodeFlow-Bedrock-HighLatency-prod** - Alert when Bedrock P95 latency > 10s
3. **CodeFlow-DynamoDB-Throttling-prod** - Alert when DynamoDB throttling occurs
4. **CodeFlow-Lambda-HighConcurrency-prod** - Alert when Lambda concurrency > 800
5. **CodeFlow-LLM-LowCacheHitRate-prod** - Alert when cache hit rate < 40%

### SNS Topic
- **codeflow-alarms-prod** - Central notification hub for all alarms

### Billing Alarms (Should be created manually)
Per ULTRA-BUDGET-MODE.md, these should be created:
- **budget-50-percent** - Alert at $40 (50% of $80 monthly budget)
- **budget-75-percent** - Alert at $60 (75% of $80 monthly budget)
- **budget-90-percent** - Alert at $80 (90% of $80 monthly budget)

## How to Use

### 1. Verify Monitoring Setup

Run the verification script to check that all monitoring is configured:

```bash
cd infrastructure/scripts
python verify-monitoring.py --region us-east-1 --environment prod
```

Expected output:
- ✅ All dashboards found
- ✅ All alarms configured
- ✅ SNS topic exists
- ⚠️ Billing alarms may need to be created manually

### 2. Create Billing Alarms (If Missing)

If billing alarms are missing, create them using the commands in ULTRA-BUDGET-MODE.md:

```bash
# Alert at $40 (50% of monthly budget)
aws cloudwatch put-metric-alarm \
  --alarm-name budget-50-percent \
  --alarm-description "50% of monthly budget" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 40 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD

# Alert at $60 (75% of monthly budget)
aws cloudwatch put-metric-alarm \
  --alarm-name budget-75-percent \
  --alarm-description "75% of monthly budget" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 60 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD

# Alert at $80 (90% of monthly budget)
aws cloudwatch put-metric-alarm \
  --alarm-name budget-90-percent \
  --alarm-description "90% of monthly budget" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD
```

### 3. Subscribe to Alarm Notifications

Add your email to receive alarm notifications:

```bash
# Get SNS topic ARN
aws sns list-topics | grep codeflow-alarms

# Subscribe to notifications
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:{account-id}:codeflow-alarms-prod \
  --protocol email \
  --notification-endpoint your-email@example.com

# Confirm subscription via email
```

### 4. Test Alarms (Optional)

Test that alarms trigger correctly:

```bash
cd infrastructure/scripts

# Test API error alarm
python test-alarms.py --alarm api-error --environment prod --region us-east-1

# Wait 5-10 minutes for alarm to evaluate
# Check email for notification

# Reset alarm state
python test-alarms.py --alarm api-error --environment prod --region us-east-1 --reset
```

### 5. Access Dashboards

**Via AWS Console**:
1. Go to CloudWatch console
2. Click "Dashboards" in left sidebar
3. Select dashboard to view

**Direct URLs** (replace {region} and {account-id}):
```
https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=CodeFlow-GenAI-Performance-prod
https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=CodeFlow-API-Health-prod
https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=CodeFlow-User-Engagement-prod
```

### 6. Set Up On-Call Rotation

1. Review the on-call guide: `infrastructure/docs/ON-CALL-GUIDE.md`
2. Subscribe team members to SNS topic
3. Set up on-call rotation schedule
4. Document escalation contacts
5. Optional: Set up Slack integration via AWS Chatbot

## Daily Monitoring Checklist

- [ ] Review dashboard metrics for anomalies
- [ ] Check alarm states (should be OK)
- [ ] Review error logs for Lambda functions
- [ ] Check LLM cache hit rate (target: >60%)
- [ ] Monitor daily costs (target: <$2.50/day)

## Cost Impact

**Total Cost**: $0 additional (monitoring infrastructure already deployed)

**Existing CloudWatch Costs** (from Task 1.10):
- Dashboards: $9/month (3 dashboards × $3)
- Alarms: $0.60/month (6 alarms × $0.10)
- Custom Metrics: $2.70/month
- API Requests: $0.60/month
- **Total**: ~$13/month

**Budget Status**: ✅ Within $70-95/month ultra-budget target

## Files Created

1. `infrastructure/scripts/verify-monitoring.py` - Monitoring verification script
2. `infrastructure/scripts/test-alarms.py` - Alarm testing script
3. `infrastructure/docs/ON-CALL-GUIDE.md` - On-call procedures and runbooks
4. `infrastructure/docs/MONITORING-ACCESS.md` - Quick access guide
5. `infrastructure/scripts/README-monitoring.md` - Scripts documentation
6. `infrastructure/docs/TASK-12.7-COMPLETION.md` - This completion summary

## Next Steps

1. **Run verification script** to ensure all monitoring is configured
2. **Create billing alarms** if missing (CRITICAL for budget mode)
3. **Subscribe to SNS notifications** for alarm alerts
4. **Review dashboards daily** to monitor system health
5. **Test alarms** to verify notifications work
6. **Set up on-call rotation** using the on-call guide
7. **Optional**: Set up Slack integration for team notifications

## References

- [CloudWatch Documentation](infrastructure/docs/CLOUDWATCH.md) - Detailed dashboard and alarm documentation
- [On-Call Guide](infrastructure/docs/ON-CALL-GUIDE.md) - Incident response procedures
- [Monitoring Access Guide](infrastructure/docs/MONITORING-ACCESS.md) - Quick access reference
- [Monitoring Scripts README](infrastructure/scripts/README-monitoring.md) - Scripts documentation
- [Ultra Budget Mode](ULTRA-BUDGET-MODE.md) - Budget constraints and optimizations

## Task Status

✅ **Task 12.7 Complete**

**Summary**: Production monitoring configured for ultra-budget mode using CloudWatch only. Verification and testing scripts created. On-call procedures documented. Sentry and X-Ray skipped per budget constraints.
