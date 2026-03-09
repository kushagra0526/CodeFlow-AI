# Vercel Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (sign up at <https://vercel.com>)

## Step 1: Push to GitHub

1. Create a new repository on GitHub (<https://github.com/new>)
   - Name it whatever you like (e.g., "codeflow-ai-platform")
   - Keep it public or private based on your preference
   - DO NOT initialize with README, .gitignore, or license

2. Push your local repository to GitHub:

   ```bash
   cd AIforbharat
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to <https://vercel.com> and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. Add Environment Variables (if needed):
   - Click "Environment Variables"
   - Add any variables from `frontend/.env.local.example`
   - Example: `NEXT_PUBLIC_API_URL`

6. Click "Deploy"

### Option B: Using Vercel CLI

1. Install Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Deploy from the root directory:

   ```bash
   cd AIforbharat
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? Yes
   - Which scope? Select your account
   - Link to existing project? No
   - Project name? (accept default or customize)
   - In which directory is your code located? `./frontend`

5. For production deployment:

   ```bash
   vercel --prod
   ```

## Step 3: Configure Environment Variables

After deployment, you may need to configure environment variables:

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add required variables from `frontend/.env.local.example`
4. Redeploy if needed

## Important Notes

- The frontend is a Next.js application located in the `frontend/` directory
- Backend infrastructure (AWS Lambda, CDK) is separate and not deployed to Vercel
- Make sure to update API endpoints in environment variables to point to your backend
- The `.env.local` file is gitignored for security

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check build logs in Vercel dashboard

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing environment variables

### API Connection Issues

- Verify `NEXT_PUBLIC_API_URL` points to correct backend
- Check CORS settings on your backend
- Ensure backend is deployed and accessible

## Next Steps

After successful deployment:

1. Test all features on the deployed URL
2. Set up custom domain (optional)
3. Configure production environment variables
4. Set up continuous deployment (automatic on git push)

## Support

- Vercel Documentation: <https://vercel.com/docs>
- Next.js Documentation: <https://nextjs.org/docs>
