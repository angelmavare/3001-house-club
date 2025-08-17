# Netlify Deployment Guide for 3001 Club House

## Overview
This guide will help you deploy your 3001 Club House application to Netlify. The application has been converted from a traditional Express server to use Netlify Functions for serverless deployment.

## Prerequisites
- A Netlify account (free at [netlify.com](https://netlify.com))
- Your Notion API key
- Git repository with your code

## Step 1: Prepare Your Repository

### 1.1 Environment Variables
Create a `.env` file in your project root (this file is already in `.gitignore`):
```bash
NOTION_API_KEY=your_actual_notion_api_key_here
PORT=3000
```

### 1.2 Verify Configuration Files
Ensure you have these files in your project:
- `netlify.toml` - Netlify configuration
- `netlify/functions/api.js` - API functions
- `package.json` - Updated with build scripts

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify UI (Recommended for first deployment)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"
   - Choose your Git provider and repository
   - Select the branch (usually `main`)

3. **Configure Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`

4. **Set Environment Variables**
   - In your site settings, go to "Environment variables"
   - Add: `NOTION_API_KEY` = `your_actual_notion_api_key`
   - Click "Deploy site"

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize and Deploy**
   ```bash
   netlify init
   netlify deploy --prod
   ```

## Step 3: Configure Environment Variables

After deployment, you must set your Notion API key:

1. Go to your site's dashboard in Netlify
2. Navigate to **Site settings** → **Environment variables**
3. Add a new variable:
   - **Key**: `NOTION_API_KEY`
   - **Value**: Your actual Notion API key
4. Click **Save**
5. Go to **Deploys** and trigger a new deploy

## Step 4: Test Your Deployment

1. **Test the main page**: Visit your Netlify URL
2. **Test API endpoints**: 
   - `/api/databases` - Should return club databases
   - `/api/miembros` - Should return members
   - `/api/logros` - Should return achievements

## Step 5: Custom Domain (Optional)

1. In your site settings, go to **Domain management**
2. Click **Add custom domain**
3. Follow the DNS configuration instructions

## Troubleshooting

### Common Issues

1. **Environment Variables Not Working**
   - Ensure you've set `NOTION_API_KEY` in Netlify
   - Redeploy after setting environment variables
   - Check the function logs in Netlify

2. **API Routes Returning 404**
   - Verify your `netlify.toml` has the correct redirects
   - Check that the `netlify/functions/api.js` file exists
   - Ensure all dependencies are in `package.json`

3. **Build Failures**
   - Check that `npm run build` works locally
   - Verify Node.js version compatibility (set to 18 in `netlify.toml`)

### Debugging

1. **Check Function Logs**
   - Go to **Functions** in your Netlify dashboard
   - Click on the function to see logs

2. **Local Testing**
   ```bash
   npm run netlify:dev
   ```

## File Structure After Deployment

```
your-project/
├── netlify.toml              # Netlify configuration
├── netlify/
│   └── functions/
│       └── api.js            # API functions
├── public/                   # Static files (published)
│   ├── index.html
│   └── assets/
├── package.json              # Dependencies and scripts
└── .env                      # Local environment (not deployed)
```

## Security Notes

- Your `.env` file is in `.gitignore` and won't be deployed
- Environment variables in Netlify are encrypted
- Never commit API keys to your repository
- The `NOTION_API_KEY` should be set in Netlify's environment variables

## Support

If you encounter issues:
1. Check the Netlify function logs
2. Verify environment variables are set correctly
3. Test locally with `netlify dev`
4. Check the Netlify community forums

## Next Steps

After successful deployment:
1. Set up monitoring and analytics
2. Configure custom domain if desired
3. Set up automatic deployments from your Git repository
4. Consider setting up staging environments 