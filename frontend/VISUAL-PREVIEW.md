# 🎨 CodeFlow AI - Visual Preview

## Design Showcase

This document describes what each page looks like. Imagine these as screenshots!

---

## 🏠 Landing Page (`/`)

### Hero Section
```
┌─────────────────────────────────────────────────────────────┐
│                     [CodeFlow AI Logo]                       │
│                                                              │
│         Master Competitive Programming with AI               │
│                                                              │
│    Analyze your LeetCode profile and get a personalized     │
│         learning roadmap. Powered by advanced AI.           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  [Glowing Input Box with Purple/Pink Gradient]     │    │
│  │  Enter your LeetCode username...  [Analyze ➜]     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│              Free forever • No credit card required          │
└─────────────────────────────────────────────────────────────┘
```

### Feature Cards (4 cards in a row)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   [🧠 Icon]  │ │   [🗺️ Icon]  │ │   [💬 Icon]  │ │   [💻 Icon]  │
│              │ │              │ │              │ │              │
│ AI Weakness  │ │    Smart     │ │  AI Mentor   │ │  Interview   │
│  Detection   │ │   Roadmaps   │ │     Chat     │ │  Simulator   │
│              │ │              │ │              │ │              │
│ Analyze your │ │ Personalized │ │ 24/7 AI help │ │ Practice with│
│ LeetCode...  │ │ learning...  │ │ for coding   │ │ AI feedback  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Colors**: Black background, purple/pink gradients, glassmorphism cards

---

## 📊 Dashboard (`/dashboard`)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  [Top Navbar with Search]                      │
├────────────┼─────────────────────────────────────────────────┤
│            │  Welcome back, coder_pro! 👋                    │
│ Dashboard  │                                                  │
│ Roadmap    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│ AI Mentor  │  │ 245  │ │ 1620 │ │Arrays│ │ 12   │          │
│ Interview  │  │Solved│ │Rating│ │Strong│ │Streak│          │
│            │  └──────┘ └──────┘ └──────┘ └──────┘          │
│            │                                                  │
│            │  ┌─────────────────────┐ ┌──────────────┐     │
│            │  │   Topic Mastery     │ │ AI Insights  │     │
│            │  │   [Radar Chart]     │ │ • Your DP... │     │
│            │  │                     │ │ • Strong in..│     │
│            │  │                     │ │ • Consider...│     │
│            │  └─────────────────────┘ └──────────────┘     │
│            │                                                  │
│            │  Your Learning Roadmap                          │
│            │  ┌──────┐ ┌──────┐ ┌──────┐                   │
│            │  │ D1   │ │ D2   │ │ D3   │                   │
│            │  │ BFS  │ │Short │ │Graph │                   │
│            │  │ ✓    │ │ ✓    │ │      │                   │
│            │  └──────┘ └──────┘ └──────┘                   │
└────────────┴─────────────────────────────────────────────────┘
```

**Key Elements**:
- 4 stat cards with icons and gradients
- Radar chart with 6 topics (Arrays, Graphs, DP, Trees, Greedy, Backtracking)
- AI insights panel with 3 insights
- Roadmap preview with 3 cards

---

## 🗺️ Roadmap Page (`/dashboard/roadmap`)

### Progress Bar
```
┌─────────────────────────────────────────────────────────────┐
│  Overall Progress                          2 of 5 completed  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │
│  └────────────────────────────────────────────────────────┘ │
│  📅 Estimated completion: 3 days remaining                   │
└─────────────────────────────────────────────────────────────┘
```

### Roadmap Cards (5 cards stacked)
```
┌─────────────────────────────────────────────────────────────┐
│ [D1] BFS Fundamentals                              [✓]      │
│      Master breadth-first search traversal patterns         │
│      [Easy]                                                  │
├─────────────────────────────────────────────────────────────┤
│ [D2] Shortest Path Algorithms                      [✓]      │
│      Learn Dijkstra and Bellman-Ford algorithms             │
│      [Medium]                                                │
├─────────────────────────────────────────────────────────────┤
│ [D3] Graph Traversal Practice                      [ ]      │
│      Solve 5 graph problems using BFS/DFS                   │
│      [Medium]                                                │
├─────────────────────────────────────────────────────────────┤
│ [D4] Dijkstra Problems                             [ ]      │
│      Advanced shortest path problem solving                 │
│      [Hard]                                                  │
├─────────────────────────────────────────────────────────────┤
│ [D5] Advanced Graph Problems                       [ ]      │
│      Topological sort and strongly connected components     │
│      [Hard]                                                  │
└─────────────────────────────────────────────────────────────┘
```

**Colors**: Green for completed, white/gray for pending, difficulty badges

---

## 💬 AI Mentor Page (`/dashboard/mentor`)

### Quick Tips (3 cards in a row)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ✨ Ask       │ │ ⚡ Instant   │ │ 🧠 Personal- │
│   Anything   │ │   Responses  │ │    ized      │
│              │ │              │ │              │
│ Get help with│ │ Powered by   │ │ Tailored to  │
│ algorithms...│ │ advanced AI  │ │ your profile │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Chat Interface
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  User: I struggle with graph problems.                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ✨ AI Mentor                                        │    │
│  │ Your LeetCode submissions suggest difficulty with   │    │
│  │ BFS traversal and adjacency list representations.   │    │
│  │                                                      │    │
│  │ I recommend starting with these fundamentals:       │    │
│  │ 1. BFS Template: Practice the standard queue-based  │    │
│  │ 2. Adjacency Lists: Master graph representation     │    │
│  │ 3. Level-order Traversal: Start with tree problems  │    │
│  │                                                      │    │
│  │ Would you like me to suggest specific problems?     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Ask your AI mentor anything...            [Send ➜] │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Suggested Questions
```
[How do I improve my DP skills?] [Explain BFS vs DFS]
[Best way to practice graphs?] [Time complexity of quicksort?]
```

**Colors**: Purple gradient for user messages, glassmorphism for AI messages

---

## 💻 Interview Page (`/dashboard/interview`)

### Stats (3 cards)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Interviews   │ │ Success Rate │ │ Avg. Time    │
│ Completed    │ │              │ │              │
│     12       │ │     75%      │ │   28 min     │
│ [✓]          │ │ [✨]         │ │ [⏱️]         │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Problem Card
```
┌─────────────────────────────────────────────────────────────┐
│ Two Sum                                            [Easy]    │
│                                                              │
│ Given an array of integers nums and an integer target,      │
│ return indices of the two numbers such that they add up     │
│ to target.                                                   │
│                                                              │
│ Example 1:                                                   │
│   Input: nums = [2,7,11,15], target = 9                    │
│   Output: [0,1]                                             │
│   Explanation: Because nums[0] + nums[1] == 9               │
│                                                              │
│ Constraints:                                                 │
│   • 2 <= nums.length <= 10^4                               │
│   • -10^9 <= nums[i] <= 10^9                               │
│   • Only one valid answer exists.                           │
│                                                              │
│ [▶️ Start Interview]  [💡 Get Hint]                         │
└─────────────────────────────────────────────────────────────┘
```

### AI Feedback Panel
```
┌─────────────────────────────────────────────────────────────┐
│ ✨ AI Feedback                                               │
│                                                              │
│ ✓ Correct Approach                                          │
│   Your hash table solution is optimal with O(n) time        │
│                                                              │
│ ✗ Edge Case Missing                                         │
│   Consider handling duplicate values in the array           │
│                                                              │
│ ✨ Code Quality                                              │
│   Good variable naming and clean structure                  │
└─────────────────────────────────────────────────────────────┘
```

**Colors**: Green for correct, red for issues, purple for suggestions

---

## 🎨 Design System

### Color Palette
- **Primary**: Purple (#a855f7)
- **Secondary**: Pink (#ec4899)
- **Background**: Black (#000000)
- **Text**: White (#ffffff)
- **Muted**: Gray (#9ca3af)

### Typography
- **Headings**: Bold, 24-48px
- **Body**: Regular, 14-16px
- **Small**: 12px
- **Font**: Geist Sans (system fallback)

### Spacing
- **Cards**: 24px padding
- **Gaps**: 16-24px between elements
- **Margins**: 32-48px for sections

### Effects
- **Glassmorphism**: `bg-white/5 backdrop-blur-xl border border-white/10`
- **Gradients**: `bg-gradient-to-r from-purple-500 to-pink-500`
- **Shadows**: `shadow-lg shadow-purple-500/50`
- **Hover**: Scale 1.02, brightness increase

### Animations
- **Page Load**: Fade in + slide up (0.5s)
- **Cards**: Stagger delay (0.1s increments)
- **Hover**: Smooth transition (0.2s)
- **Chat**: Slide in from bottom (0.3s)

---

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3-4 columns)

All pages are fully responsive and look great on all devices!

---

## 🎯 Key Visual Features

1. **Glassmorphism**: Frosted glass effect on all cards
2. **Gradients**: Purple/pink gradients throughout
3. **Animations**: Smooth Framer Motion animations
4. **Icons**: Lucide icons with consistent style
5. **Charts**: Recharts with custom purple theme
6. **Badges**: Difficulty badges with color coding
7. **Hover Effects**: Subtle scale and glow effects
8. **Scrollbar**: Custom purple scrollbar

---

**The UI is designed to look like a premium AI SaaS product that could win a hackathon demo!** 🏆
