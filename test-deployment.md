# Vercel Deployment Testing Guide

## Quick Test Steps

After deploying to Vercel, follow these steps to verify everything is working:

### 1. Test API Health Check
Visit: `https://your-vercel-domain.vercel.app/api/health`

Expected response:
```json
{
  "message": "VSA API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "supabaseUrl": "SET",
  "supabaseKey": "SET",
  "jwtSecret": "SET"
}
```

### 2. Test Public Posts Endpoint
Visit: `https://your-vercel-domain.vercel.app/api/posts/public`

This should return public posts without authentication.

### 3. Test Announcements Endpoint
Visit: `https://your-vercel-domain.vercel.app/api/posts/announcements`

This should return announcements without authentication.

### 4. Check Browser Console
1. Open your Vercel-deployed website
2. Open browser developer tools (F12)
3. Go to Console tab
4. Look for any network errors or CORS errors

### 5. Check Vercel Function Logs
1. Go to Vercel Dashboard
2. Select your project
3. Go to Functions tab
4. Check for any error logs

## Common Issues and Solutions

### Issue: "Network Error" in browser console
**Solution**: Check that all environment variables are set in Vercel dashboard

### Issue: CORS errors
**Solution**: The backend is configured to allow Vercel domains. Check that your domain is in the allowedOrigins list.

### Issue: Posts/Announcements not showing
**Solution**: 
1. Check the `/api/health` endpoint first
2. Verify Supabase environment variables are set
3. Check Vercel function logs for database connection errors

### Issue: Authentication not working
**Solution**: 
1. Verify JWT_SECRET is set in Vercel
2. Check that SUPABASE_SERVICE_KEY is set
3. Test the `/api/auth/login` endpoint

## Environment Variables Checklist

Make sure these are set in Vercel Dashboard:

### Backend Variables:
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_KEY` 
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `SUPABASE_BUCKET`
- [ ] `JWT_SECRET`
- [ ] `NODE_ENV` = "production"

### Frontend Variables:
- [ ] `REACT_APP_SUPABASE_URL`
- [ ] `REACT_APP_SUPABASE_ANON_KEY`

## Debugging Commands

If you need to check the deployment locally:

```bash
# Test API locally
curl http://localhost:5001/api/health

# Test with Vercel CLI (if installed)
vercel env ls
vercel logs
``` 