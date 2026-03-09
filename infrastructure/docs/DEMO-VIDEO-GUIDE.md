# CodeFlow AI Platform - Demo Video Recording Guide

**Duration**: 5-10 minutes  
**Format**: MP4, 1080p, 30fps  
**Tools**: OBS Studio, Zoom, or Loom  
**Team**: Lahar Joshi, Kushagra Pratap Rajput, Harshita Devanani

---

## 🎥 Video Recording Setup

### Software Requirements

**Option 1: OBS Studio (Recommended)**
- Free and open-source
- Professional quality
- Download: https://obsproject.com/

**Option 2: Zoom**
- Record yourself presenting
- Share screen for demos
- Easy to use

**Option 3: Loom**
- Quick screen recording
- Automatic upload
- Free tier available

### Recording Settings

**Resolution**: 1920x1080 (1080p)  
**Frame Rate**: 30 fps  
**Bitrate**: 5000 kbps (video), 192 kbps (audio)  
**Format**: MP4 (H.264 codec)  
**Audio**: Clear microphone, no background noise

### Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│                    Top: Webcam (Optional)                │
│                    Small corner overlay                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                  Main: Terminal/Browser                  │
│                  Large, readable font                    │
│                  Dark theme recommended                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│              Bottom: Slides/Architecture                 │
│              Show diagrams when explaining               │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Video Script (8-10 minutes)

### Scene 1: Introduction (30 seconds)

**Visual**: Team members on camera (optional) or title slide

**Script**:
> "Hi, I'm [Name] from Team CodeFlow AI. Today I'll show you how we're helping students from Tier 2 and Tier 3 colleges with proper DSA guidance using Amazon Bedrock and AWS serverless architecture.
>
> Our platform uses 6 advanced GenAI features to provide personalized, AI-powered learning paths that adapt to each student's strengths and weaknesses.
>
> Let me show you how it works."

**Actions**:
- Show team members (if on camera)
- Display title slide with team names
- Show mission statement

---

### Scene 2: Architecture Overview (1 minute)

**Visual**: Architecture diagram from `ARCHITECTURE-DIAGRAMS.md`

**Script**:
> "Here's our architecture. We're using AWS Lambda for compute, DynamoDB for data storage, and Amazon Bedrock for AI capabilities.
>
> The key services are:
> - 5 Lambda functions for different features
> - 7 DynamoDB tables for data persistence
> - Amazon Bedrock with Claude 3 Sonnet for AI reasoning
> - API Gateway for REST API with rate limiting
> - CloudWatch for monitoring and billing alarms
>
> Our monthly cost is just $70-95, staying well within our $260 budget for 3 months. This is possible because of our LLM caching strategy, which achieves a 90% cache hit rate and saves 60% on Bedrock costs.
>
> Now let me show you the live demo."

**Actions**:
- Show high-level architecture diagram
- Highlight key AWS services
- Point to cost breakdown
- Transition to terminal

---

### Scene 3: User Registration (30 seconds)

**Visual**: Terminal with large font, dark theme

**Script**:
> "First, let's register a new user. I'll use the API endpoint to create an account with a LeetCode username."

**Actions**:
```bash
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "leetcode_username": "demo_student",
    "email": "demo@codeflow.ai",
    "password": "SecureDemo123!",
    "language_preference": "en"
  }' | jq
```

**Script (continued)**:
> "Great! We received a JWT token and user ID. This token will be used for all authenticated requests."

**Actions**:
- Show JSON response
- Highlight access_token and user_id
- Save to environment variables

---

### Scene 4: Profile Analysis (1 minute)

**Visual**: Terminal showing API response

**Script**:
> "Now let's analyze the student's LeetCode profile to identify their strengths and weaknesses."

**Actions**:
```bash
curl -X POST $API_URL/analyze/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "leetcode_username": "demo_student"
  }' | jq
```

**Script (continued)**:
> "The system analyzed their submission history and calculated proficiency for each topic.
>
> Notice that Dynamic Programming is at 35.5% proficiency - that's classified as 'weak'. Arrays are at 78.2% - that's 'strong'.
>
> This is our first GenAI feature: AI Weakness Detection Engine. It identifies patterns across 100+ submissions to find areas that need improvement."

**Actions**:
- Show topic proficiency breakdown
- Highlight weak topics (< 40%)
- Highlight strong topics (> 70%)
- Explain classification rules

---

### Scene 5: Learning Path Generation (1.5 minutes)

**Visual**: Terminal showing Bedrock-generated path

**Script**:
> "Now comes the magic - let's use Amazon Bedrock to generate a personalized learning path."

**Actions**:
```bash
curl -X POST $API_URL/recommendations/generate-path \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "weak_topics": ["dynamic-programming", "graphs"],
    "strong_topics": ["arrays", "strings"],
    "proficiency_level": "intermediate"
  }' | jq
```

**Script (continued)**:
> "Bedrock Claude 3 Sonnet just generated a custom 25-problem learning path in about 3 seconds.
>
> Notice the logical progression: we start with 'Climbing Stairs' - a simple DP problem. Then 'House Robber' which builds on those concepts. Then 'Coin Change' - a classic DP problem.
>
> Each problem has a reason explaining why it's included. 70% of the problems target weak topics like Dynamic Programming and Graphs.
>
> This is our fourth GenAI feature: Personalized Learning Roadmap. Without Bedrock, we couldn't generate these intelligent sequences."

**Actions**:
- Show problem sequence
- Highlight problem titles and reasons
- Point out difficulty progression
- Explain 70% weak topic targeting

---

### Scene 6: AI Chat Mentor - First Query (2 minutes)

**Visual**: Terminal showing chat interaction

**Script**:
> "Now let me show you our most advanced feature - the AI Chat Mentor with RAG.
>
> Let's say a student is stuck on a problem and their code is getting Time Limit Exceeded. They can ask the AI mentor for help."

**Actions**:
```bash
curl -X POST $API_URL/chat-mentor \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "message": "Why is my DP solution getting TLE?",
    "code": "def solve(n):\n    if n <= 1:\n        return n\n    return solve(n-1) + solve(n-2)",
    "problem_id": "fibonacci-number"
  }' | jq
```

**Script (continued)**:
> "Look at what just happened. The system performed multi-step reasoning:
>
> 1. Intent Detection: Identified this as CODE_DEBUGGING
> 2. Cache Check: First time query, so cache miss
> 3. RAG Retrieval: Found relevant DP patterns from our knowledge base
> 4. Code Analysis: Detected exponential time complexity O(2^n)
> 5. Bedrock Reasoning: Generated this detailed explanation
> 6. Cache Storage: Stored the response for 7 days
>
> Notice the AI explained the problem WITHOUT giving the solution. It identified the issue - plain recursion without memoization - and explained why it's slow, but didn't write the code for them.
>
> This took about 3 seconds and cost $0.015. But watch what happens when we ask the same question again..."

**Actions**:
- Show AI response
- Highlight intent detection
- Point out RAG sources
- Explain multi-step reasoning
- Show response time and cost

---

### Scene 7: AI Chat Mentor - Cache Hit (1 minute)

**Visual**: Terminal showing cached response

**Script**:
> "Let me ask the exact same question again."

**Actions**:
```bash
curl -X POST $API_URL/chat-mentor \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "message": "Why is my DP solution getting TLE?",
    "code": "def solve(n):\n    if n <= 1:\n        return n\n    return solve(n-1) + solve(n-2)",
    "problem_id": "fibonacci-number"
  }' | jq
```

**Script (continued)**:
> "Notice the difference:
> - Same response, but 'cached' is now true
> - Response time: 45 milliseconds instead of 3 seconds
> - Cost: $0.0001 instead of $0.015
>
> That's a 99.3% cost reduction and 98.5% latency reduction!
>
> This is our sixth GenAI feature: LLM Cost Optimization. With a 90% cache hit rate, we save 60% on Bedrock costs. That's how we stay within our $260 budget."

**Actions**:
- Show cached response
- Highlight cache_hit_time_ms
- Compare costs ($0.0001 vs $0.015)
- Explain 90% cache hit rate target

---

### Scene 8: Adaptive Hints (1 minute)

**Visual**: Terminal showing hint generation

**Script**:
> "Students often need hints without wanting the full solution. Our hint system provides progressive levels of guidance."

**Actions**:
```bash
curl -X POST $API_URL/recommendations/hint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "two-sum",
    "problem_description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "user_id": "'$USER_ID'",
    "hint_level": 1
  }' | jq
```

**Script (continued)**:
> "This is Level 1 - a high-level approach. It asks the student to think about data structures without revealing which one.
>
> Level 2 would suggest using a hash map. Level 3 would outline the algorithm. But none of them give code.
>
> Bedrock enforces this code-free constraint in the system prompt. This is our second GenAI feature: Adaptive Hint Generation Engine."

**Actions**:
- Show hint response
- Explain progressive levels
- Highlight code-free constraint

---

### Scene 9: Progress Tracking (30 seconds)

**Visual**: Terminal showing progress data

**Script**:
> "Finally, let's check the student's progress."

**Actions**:
```bash
curl -X GET "$API_URL/progress/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Script (continued)**:
> "The system tracks streaks, badges, and problems solved. This gamification keeps students motivated.
>
> Notice the 7-day streak and the badge earned. The next milestone is 30 days."

**Actions**:
- Show streak count
- Show badges earned
- Show next milestone

---

### Scene 10: Cost Breakdown (1 minute)

**Visual**: Cost breakdown diagram

**Script**:
> "Let me show you how we stay within budget.
>
> Our monthly cost is $70-95, broken down as:
> - Bedrock: $20-30 (with 90% cache hit rate)
> - Lambda: $15
> - API Gateway: $15
> - DynamoDB: $10
> - Other services: $10-15
>
> Over 3 months, that's $250 - well within our $260 budget with a $10 buffer.
>
> The key is our LLM cache. Without it, Bedrock alone would cost $50/month. With 90% cache hit rate, we reduce that to $20/month. That's $30/month savings, or $90 over 3 months."

**Actions**:
- Show cost breakdown pie chart
- Highlight Bedrock savings
- Show 3-month projection

---

### Scene 11: Why GenAI is Load-Bearing (30 seconds)

**Visual**: Slide showing features that require Bedrock

**Script**:
> "This is not a wrapper around ChatGPT. GenAI is essential to our core functionality.
>
> Without Bedrock, we cannot:
> - Generate personalized learning paths
> - Provide code debugging assistance
> - Adapt hints to student level
> - Detect patterns in submissions
> - Explain concepts conversationally
>
> Every core feature depends on Bedrock. This is true AI-powered education."

**Actions**:
- Show list of features
- Emphasize "cannot" without Bedrock
- Highlight multi-step reasoning

---

### Scene 12: Conclusion (30 seconds)

**Visual**: Team members or closing slide

**Script**:
> "To recap, CodeFlow AI demonstrates true load-bearing GenAI with 6 advanced features:
>
> 1. AI Code Debugging Assistant
> 2. Adaptive Hint Generation Engine
> 3. AI Weakness Detection Engine
> 4. Personalized Learning Roadmap
> 5. Programmer-Aware AI Mentor Chatbot
> 6. LLM Cost Optimization
>
> We're helping students from Tier 2 and Tier 3 colleges succeed with proper DSA guidance. Built on AWS with production-ready architecture. Within budget at $70-95/month.
>
> Thank you for watching! Questions?"

**Actions**:
- Show team members
- Display contact information
- Show GitHub repository link

---

## 🎬 Recording Checklist

### Pre-Recording

- [ ] Test all API endpoints
- [ ] Verify API Gateway URL is correct
- [ ] Create demo user account
- [ ] Prepare environment variables (API_URL, TOKEN, USER_ID)
- [ ] Test all demo commands
- [ ] Install jq for JSON formatting
- [ ] Set up OBS Studio or recording software
- [ ] Test microphone audio quality
- [ ] Close unnecessary applications
- [ ] Set terminal font size to 18-20pt
- [ ] Use dark terminal theme (easier on eyes)
- [ ] Prepare architecture diagrams
- [ ] Prepare cost breakdown slides
- [ ] Practice script 3+ times
- [ ] Time yourself (aim for 8-10 minutes)

### During Recording

- [ ] Start recording
- [ ] Introduce yourself and team
- [ ] Show architecture diagram
- [ ] Run demo commands in order
- [ ] Explain each step clearly
- [ ] Highlight key GenAI features
- [ ] Show cost breakdown
- [ ] Emphasize load-bearing AI
- [ ] Conclude with recap
- [ ] Stop recording

### Post-Recording

- [ ] Review video for errors
- [ ] Check audio quality
- [ ] Trim unnecessary parts
- [ ] Add title slide (if needed)
- [ ] Add captions/subtitles (optional)
- [ ] Export as MP4 (1080p, 30fps)
- [ ] Upload to YouTube/Vimeo (unlisted)
- [ ] Test video playback
- [ ] Share link with team
- [ ] Submit to hackathon platform

---

## 🎨 Video Editing Tips

### OBS Studio Setup

1. **Add Sources**:
   - Display Capture (for full screen)
   - Window Capture (for specific window)
   - Video Capture Device (for webcam)
   - Audio Input Capture (for microphone)

2. **Scene Layout**:
   - Main scene: Terminal/Browser (full screen)
   - Picture-in-picture: Webcam (small corner)
   - Slides scene: Architecture diagrams

3. **Recording Settings**:
   - Output → Recording Format: MP4
   - Output → Video Bitrate: 5000 Kbps
   - Output → Audio Bitrate: 192 Kbps
   - Video → Base Resolution: 1920x1080
   - Video → Output Resolution: 1920x1080
   - Video → FPS: 30

### Post-Production (Optional)

**Tools**: DaVinci Resolve (free), iMovie, Adobe Premiere

**Edits**:
- Trim dead air at start/end
- Add title slide (5 seconds)
- Add transition between scenes (fade)
- Add background music (low volume)
- Add captions for key points
- Add zoom-in for important details
- Add annotations for AWS services

---

## 📤 Video Upload & Sharing

### YouTube Upload

1. Go to https://studio.youtube.com/
2. Click "Create" → "Upload videos"
3. Select your MP4 file
4. Title: "CodeFlow AI Platform - AWS Hackathon Demo"
5. Description: Include team names, AWS services, GitHub link
6. Visibility: Unlisted (or Public)
7. Add to playlist: "AWS Hackathon 2024"
8. Publish

### Vimeo Upload

1. Go to https://vimeo.com/upload
2. Select your MP4 file
3. Title: "CodeFlow AI Platform - AWS Hackathon Demo"
4. Description: Include team names, AWS services, GitHub link
5. Privacy: Anyone with link (or Public)
6. Publish

### Loom Upload

1. Record directly in Loom
2. Automatic upload
3. Share link with team
4. Embed in documentation

---

## 🎯 Video Quality Checklist

### Visual Quality

- [ ] 1080p resolution (1920x1080)
- [ ] 30 fps frame rate
- [ ] Clear, readable text (18-20pt font)
- [ ] Dark theme (easier on eyes)
- [ ] No screen tearing or lag
- [ ] Smooth transitions between scenes

### Audio Quality

- [ ] Clear voice (no background noise)
- [ ] Consistent volume level
- [ ] No echo or reverb
- [ ] No clipping or distortion
- [ ] Background music (optional, low volume)

### Content Quality

- [ ] All demo commands work
- [ ] API responses are correct
- [ ] Explanations are clear
- [ ] Timing is 8-10 minutes
- [ ] All 6 GenAI features shown
- [ ] Cost breakdown explained
- [ ] Load-bearing AI emphasized

---

## 🚨 Backup Plan

### If Recording Fails

1. **Re-record**: Try again with better preparation
2. **Screen Recording**: Use Zoom or Loom instead of OBS
3. **Slides Only**: Create slide deck with screenshots
4. **Live Demo**: Present live during hackathon

### If API Fails During Recording

1. **Use Mock Data**: Prepare JSON responses in advance
2. **Show Screenshots**: Capture successful API calls beforehand
3. **Explain Conceptually**: Walk through architecture without live demo
4. **Show Code**: Display Lambda function code instead

---

## 📊 Video Analytics (Post-Upload)

### Track Metrics

- **Views**: How many people watched
- **Watch Time**: Average duration watched
- **Engagement**: Likes, comments, shares
- **Click-Through Rate**: Link clicks in description

### Optimize

- Add timestamps in description
- Add chapters for easy navigation
- Respond to comments
- Share on social media

---

## 🎓 Learning Resources

### OBS Studio Tutorials

- Official Guide: https://obsproject.com/wiki/
- YouTube: "OBS Studio Tutorial for Beginners"
- Reddit: r/obs

### Video Editing

- DaVinci Resolve: https://www.blackmagicdesign.com/products/davinciresolve/
- iMovie: Built-in on Mac
- Adobe Premiere: Professional editing

### Screen Recording

- OBS Studio: https://obsproject.com/
- Zoom: https://zoom.us/
- Loom: https://www.loom.com/

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: Ready for Recording ✅
