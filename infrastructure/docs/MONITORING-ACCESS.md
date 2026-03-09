# Monitoring Access Guide

## Quick Access to CloudWatch Monitoring

This guide provides quick links and commands to access CloudWatch dashboards and alarms for the CodeFlow AI Platform.

## CloudWatch Dashboards

### Direct Console URLs

Replace `{region}` with your AWS region (e.g., `us-east-1`) and `{environment}` with your environment (e.g., `prod`):

**GenAI Performance Dashboard**:
```
https://{region}.console.aws.amazon.com/cloudwatch/home?region={region}#dashboards:name=CodeFlow-GenAI-Performance-{environment}
```

**API Health Dashboard**:
```
https://{region}.console.aws.amazon.com/cloudwatch/home?region={region}#dashboards:name=CodeFlow-API-Health-{environment}
```

**User Engagement Dashboard**:
```
https://{region}.console.aws.amazon.com/cloudwatch/home?region={region}#dashboards:name=CodeFlow-User-Engagement-{environment}
```

**All Alarms**:
```
https://{region}.console.aws.amazon.com/cloudwatch/home?region={region}#alarmsV2:
```

### CLI Access

List all dashboards:
```bash
aws cloudwatch list-dashboards --region us-east-1
```

Get dashboard definition:
```bash
aws cloudwatch get-dashboard \
  --dashboard-name CodeFlow-GenAI-Performance-prod \
  --region us-east-1
```

## CloudWatch Alarms

### View Alarm States

List all alarms with their current states:
```bash
aws cloudwatch describe-alarms \
  --region us-east-1 \
  --query 'MetricAlarms[*].[AlarmName,StateValue,StateReason]' \
  --output table
```

### View Specific Alarm

Get details for a specific alarm:
```bash
aws cloudwatch describe-alarms \
  --alarm-names CodeFlow-API-ErrorRate-prod \
  --region us-east-1
```

### View Alarm History

See recent alarm state changes:
```bash
aws cloudwatch describe-alarm-history \
  --alarm-name CodeFlow-API-ErrorRate-prod \
  --region us-east-1 \
  --max-records 10
```

## CloudWatch Logs

### Lambda Function Logs

Tail logs for a specific Lambda function:
```bash
# Auth function
aws logs tail /aws/lambda/auth --follow --since 1h

# Analysis function
aws logs tail /aws/lambda/analysis --follow --since 1h

# Recommendations function
aws logs tail /aws/lambda/recommendations --follow --since 1h

# Chat Mentor function
aws logs tail /aws/lambda/chat-mentor --follow --since 1h

# Scraping function
aws logs tail /aws/lambda/scraping --follow --since 1h
```

### Filter Logs for Errors

```bash
aws logs tail /aws/lambda/chat-mentor \
  --follow \
  --since 1h \
  --filter-pattern "ERROR"
```

### API Gateway Logs

```bash
aws logs tail /aws/apigateway/codeflow-api --follow --since 1h
```

## CloudWatch Metrics

### View Custom Metrics

List all custom metrics in the CodeFlow namespace:
```bash
aws cloudwatch list-metrics \
  --namespace CodeFlow/GenAI \
  --region us-east-1
```

### Get Metric Statistics

**Bedrock Latency (last 24 hours)**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace CodeFlow/GenAI \
  --metric-name BedrockLatency \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum \
  --region us-east-1
```

**LLM Cache Hit Rate (last 24 hours)**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace CodeFlow/GenAI \
  --metric-name LLMCacheHitRate \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average \
  --region us-east-1
```

**Token Usage (last 24 hours)**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace CodeFlow/GenAI \
  --metric-name TokensUsed \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

## SNS Topic Subscriptions

### Subscribe to Alarm Notifications

**Email Subscription**:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:{account-id}:codeflow-alarms-prod \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1
```

**SMS Subscription**:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:{account-id}:codeflow-alarms-prod \
  --protocol sms \
  --notification-endpoint +1234567890 \
  --region us-east-1
```

### List Current Subscriptions

```bash
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:{account-id}:codeflow-alarms-prod \
  --region us-east-1
```

## Cost Monitoring

### Current Month Costs

```bash
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1
```

### Daily Costs (Last 7 Days)

```bash
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --region us-east-1
```

### Costs by Service (Current Month)

```bash
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --region us-east-1
```

## Verification Scripts

### Verify Monitoring Setup

Run the monitoring verification script:
```bash
cd infrastructure/scripts
python verify-monitoring.py --region us-east-1 --environment prod
```

### Test Alarms

Test specific alarms to verify they trigger correctly:
```bash
cd infrastructure/scripts

# Test billing alarm
python test-alarms.py --alarm billing --region us-east-1

# Test API error alarm
python test-alarms.py --alarm api-error --environment prod --region us-east-1

# Test Bedrock latency alarm
python test-alarms.py --alarm bedrock-latency --environment prod --region us-east-1

# Test all alarms
python test-alarms.py --alarm all --environment prod --region us-east-1

# Reset alarm states after testing
python test-alarms.py --alarm all --environment prod --region us-east-1 --reset
```

## Mobile Access

### CloudWatch Mobile App

1. Download the CloudWatch mobile app:
   - iOS: [App Store](https://apps.apple.com/us/app/amazon-cloudwatch/id1453286325)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=com.amazon.aws.cloudwatch)

2. Sign in with your AWS credentials

3. Add dashboards to favorites for quick access

4. Enable push notifications for alarms

## Slack Integration (Optional)

### Setup AWS Chatbot

1. Go to AWS Chatbot console
2. Click "Configure new client"
3. Select "Slack"
4. Authorize AWS Chatbot to access your Slack workspace
5. Create a channel configuration:
   - Channel name: `#codeflow-alerts`
   - IAM role: Create new role with CloudWatch read permissions
   - SNS topics: Add `codeflow-alarms-prod`
6. Test the integration

### Slack Commands

Once configured, you can use Slack commands:
```
@aws cloudwatch describe-alarms
@aws cloudwatch get-dashboard --dashboard-name CodeFlow-GenAI-Performance-prod
@aws logs tail /aws/lambda/chat-mentor --since 1h
```

## Monitoring Checklist

### Daily Checks
- [ ] Review dashboard metrics for anomalies
- [ ] Check alarm states (should be OK)
- [ ] Review error logs for Lambda functions
- [ ] Check LLM cache hit rate (target: >60%)
- [ ] Monitor daily costs (target: <$2.50/day)

### Weekly Checks
- [ ] Review weekly cost trends
- [ ] Analyze performance metrics (P95, P99 latencies)
- [ ] Check for any recurring errors
- [ ] Review alarm thresholds and adjust if needed
- [ ] Update on-call rotation

### Monthly Checks
- [ ] Review monthly costs vs budget
- [ ] Analyze user engagement metrics
- [ ] Review and optimize high-cost services
- [ ] Update monitoring documentation
- [ ] Conduct incident retrospectives

## Troubleshooting

### Can't Access Dashboards

**Issue**: "Access Denied" error when accessing CloudWatch console

**Solution**:
1. Verify IAM permissions include `cloudwatch:GetDashboard`
2. Check if dashboards exist: `aws cloudwatch list-dashboards`
3. Verify region is correct

### No Data in Dashboards

**Issue**: Dashboard widgets show "No data available"

**Solution**:
1. Check if Lambda functions are publishing metrics
2. Verify metric namespace and names are correct
3. Expand time range to last 24 hours
4. Check Lambda function logs for metric publishing errors

### Alarms Not Triggering

**Issue**: Alarms stay in "Insufficient data" state

**Solution**:
1. Verify metrics are being published regularly
2. Check alarm configuration: `aws cloudwatch describe-alarms --alarm-names <name>`
3. Adjust "Treat missing data" setting to "Not breaching"
4. Verify SNS topic exists and has subscriptions

### Not Receiving Notifications

**Issue**: Alarms trigger but no notifications received

**Solution**:
1. Check SNS topic subscriptions: `aws sns list-subscriptions-by-topic`
2. Verify email subscription is confirmed (check spam folder)
3. Check SNS topic permissions
4. Test SNS topic: `aws sns publish --topic-arn <arn> --message "Test"`

## References

- [CloudWatch Documentation](CLOUDWATCH.md)
- [On-Call Guide](ON-CALL-GUIDE.md)
- [Ultra Budget Mode](../../ULTRA-BUDGET-MODE.md)
- [AWS CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
- [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home)
