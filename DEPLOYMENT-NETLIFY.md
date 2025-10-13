# 🌐 Deploy VerificaYa to Netlify (Advanced)

**Difficulty:** Medium  
**Time:** 15-20 minutes  
**Best for:** Static sites with serverless functions

---

## ⚠️ IMPORTANT: Read This First

**Netlify works for your app, BUT:**
- Requires Next.js plugin configuration
- More complex setup than Vercel
- Slower builds
- Limited Next.js 15 support

**Recommendation:** Use Vercel instead (see DEPLOYMENT-VERCEL.md)

---

## 🛠️ Step 1: Fix Build Configuration

### 1.1 Update package.json

Remove `--turbopack` from build script:

**Before:**
```json
"build": "next build --turbopack"
```

**After:**
```json
"build": "next build"
```

### 1.2 Create netlify.toml

Create file at root: `c:\code\proptech\tenant-screening\netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404

[functions]
  directory = ".netlify/functions"
  node_bundler = "esbuild"
```

---

## 📦 Step 2: Install Netlify Plugin

Run in terminal:

```bash
cd C:\code\proptech\tenant-screening
npm install -D @netlify/plugin-nextjs
```

---

## 🚀 Step 3: Deploy to Netlify

### Option A: Netlify UI (Easier)

1. Go to **https://app.netlify.com**
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub
4. Select **`apolmig/verificaya`** repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Functions directory:** `.netlify/functions`

6. Add environment variables (see Step 4)
7. Click **"Deploy site"**

### Option B: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
cd C:\code\proptech\tenant-screening
netlify init

# Deploy
netlify deploy --prod
```

---

## 🔑 Step 4: Environment Variables

In Netlify Dashboard → Site settings → Environment variables:

### For Demo Mode (Minimum):
```
# No variables needed!
# App works with mock data
```

### For Production:

**Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL=https://dhtklergxhybdzqinfqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Stripe:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Google Cloud (Optional):**
```
GOOGLE_CLOUD_PROJECT_ID=tenant-screening-ocr
GOOGLE_CLOUD_CLIENT_EMAIL=tenant-screening@...iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## ⚙️ Step 5: Update next.config.ts

Add output configuration for Netlify:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify requires standalone output
  output: 'standalone',
  
  // Optimize images for Netlify
  images: {
    unoptimized: true, // Netlify doesn't support Next.js image optimization
  },
};

export default nextConfig;
```

---

## 🧪 Testing

### Test 1: Build Locally
```bash
cd C:\code\proptech\tenant-screening
npm run build
npm start
```

Visit http://localhost:3000 - should work!

### Test 2: Test on Netlify
```
Your URL: https://your-site-name.netlify.app
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Build Fails - "Turbopack not supported"

**Fix:** Remove `--turbopack` from package.json build script

### Issue 2: API Routes Return 404

**Problem:** Netlify doesn't automatically handle Next.js API routes

**Fix:** Ensure `@netlify/plugin-nextjs` is installed and in netlify.toml

### Issue 3: Images Don't Load

**Problem:** Next.js Image optimization not supported on Netlify

**Fix:** Add to next.config.ts:
```typescript
images: {
  unoptimized: true
}
```

### Issue 4: Environment Variables Not Working

**Fix:** 
1. Check variable names match exactly (case-sensitive)
2. Redeploy after adding variables
3. Use `NEXT_PUBLIC_` prefix for client-side variables

### Issue 5: Cold Start Delays

**Problem:** Serverless functions sleep after inactivity

**Fix:** Netlify free tier has cold starts (2-5 seconds)
- Upgrade to Pro ($19/mo) for faster functions
- Or use Vercel (better cold starts on free tier)

---

## 📊 Netlify vs Vercel Comparison

| Feature | Netlify | Vercel |
|---------|---------|--------|
| Next.js Support | Plugin required | Native |
| Build Time | 3-5 min | 1-2 min |
| API Routes | Via plugin | Automatic |
| Image Optimization | No | Yes |
| Free Builds/Month | 300 minutes | Unlimited |
| Cold Start | 2-5 seconds | <1 second |
| Best For | Static sites | Next.js apps |

---

## 💰 Pricing

### Netlify Free Tier:
- 300 build minutes/month
- 100GB bandwidth
- 1,000 serverless function hours

### Netlify Pro ($19/mo):
- 25,000 build minutes/month
- 400GB bandwidth
- Faster builds
- Background functions

**Recommendation:** Start with Vercel free tier (unlimited builds)

---

## ✅ Deployment Checklist

- [ ] Remove `--turbopack` from package.json
- [ ] Create netlify.toml
- [ ] Install @netlify/plugin-nextjs
- [ ] Update next.config.ts (output: 'standalone')
- [ ] Add environment variables
- [ ] Test build locally
- [ ] Deploy to Netlify
- [ ] Test all features
- [ ] Configure custom domain (optional)
- [ ] Set up Stripe webhook

---

## 🎯 Recommendation

**For VerificaYa, we strongly recommend Vercel:**

✅ **Vercel Pros:**
- Zero configuration needed
- API routes work immediately
- Faster builds (1-2 min vs 3-5 min)
- Better Next.js 15 support
- Unlimited free builds
- Image optimization included

❌ **Netlify Cons:**
- Requires plugin setup
- Slower builds
- No image optimization
- Limited build minutes (300/mo)
- More configuration needed

---

## 🔗 Resources

- Netlify Docs: https://docs.netlify.com
- Next.js on Netlify: https://docs.netlify.com/frameworks/next-js/overview/
- Plugin: https://github.com/netlify/netlify-plugin-nextjs

---

**Need help?** Check DEPLOYMENT-VERCEL.md for easier deployment! 🚀
