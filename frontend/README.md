# CodeFlow AI - Frontend

A stunning, production-quality frontend for CodeFlow AI Platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🎨 Design Features

- **Modern SaaS Dashboard**: Inspired by Vercel, Linear, and Perplexity AI
- **Dark Mode Default**: Beautiful dark theme with glassmorphism effects
- **Smooth Animations**: Framer Motion animations throughout
- **Responsive Design**: Works perfectly on all devices
- **Premium UI Components**: Custom-built with shadcn/ui patterns

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Custom components with shadcn/ui patterns
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🎯 Pages

### Landing Page (`/`)
- Hero section with glowing input box
- Feature cards with hover animations
- Gradient backgrounds and blur effects

### Dashboard (`/dashboard`)
- Stats cards (Problems Solved, Rating, Streak)
- Radar chart for topic mastery
- AI insights panel
- Learning roadmap preview

### Roadmap (`/dashboard/roadmap`)
- Full learning path with progress tracking
- Day-by-day breakdown
- Difficulty badges
- Completion status

### AI Mentor (`/dashboard/mentor`)
- ChatGPT-like interface
- Real-time message streaming
- Suggested questions
- Quick tips panel

### Interview Simulator (`/dashboard/interview`)
- Problem card with details
- Timer and stats
- AI feedback panel
- Start/stop interview controls

## 🎨 Design System

### Colors
- **Primary**: Purple (#a855f7)
- **Secondary**: Pink (#ec4899)
- **Background**: Black (#000000)
- **Text**: White (#ffffff)
- **Muted**: Gray (#9ca3af)

### Components
- **Glassmorphism**: `bg-white/5 backdrop-blur-xl border border-white/10`
- **Gradients**: `from-purple-500 to-pink-500`
- **Hover Effects**: Smooth transitions with shadow effects
- **Animations**: Framer Motion with stagger delays

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   └── dashboard/
│       ├── layout.tsx           # Dashboard layout
│       ├── page.tsx             # Dashboard home
│       ├── roadmap/page.tsx     # Roadmap page
│       ├── mentor/page.tsx      # AI Mentor page
│       └── interview/page.tsx   # Interview page
├── components/
│   ├── navbar.tsx               # Top navigation
│   ├── sidebar.tsx              # Side navigation
│   ├── stat-card.tsx            # Stat display card
│   ├── radar-chart.tsx          # Topic mastery chart
│   ├── roadmap-card.tsx         # Roadmap item card
│   ├── ai-chat.tsx              # Chat interface
│   └── problem-card.tsx         # Problem display card
└── lib/
    ├── utils.ts                 # Utility functions
    └── mock-data.ts             # Mock data for demo
```

## 🔌 API Integration

The frontend is structured to easily connect to your backend API. Update the mock data in `lib/mock-data.ts` with real API calls:

```typescript
// Example: Replace mock data with API call
const fetchUserData = async (username: string) => {
  const response = await fetch(`/api/users/${username}`)
  return response.json()
}
```

## 🎭 Mock Data

Currently using mock data for demo purposes. All data is in `lib/mock-data.ts`:

- User profile data
- Topic mastery scores
- Learning roadmap
- Chat history
- Interview problems

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### AWS Amplify
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize and deploy
amplify init
amplify add hosting
amplify publish
```

## 🎨 Customization

### Colors
Update colors in `tailwind.config.ts`:
```typescript
colors: {
  purple: { ... },
  pink: { ... }
}
```

### Fonts
Update fonts in `app/layout.tsx`:
```typescript
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"] })
```

### Animations
Adjust animation timings in components:
```typescript
transition={{ delay: 0.2, duration: 0.5 }}
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ for hackathon demos
