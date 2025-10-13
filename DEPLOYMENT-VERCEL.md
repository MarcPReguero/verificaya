# 🚀 Deploy VerificaYa to Vercel

**Time:** 5-10 minutes  
**Cost:** FREE (Hobby plan)  
**Best for:** Next.js apps with API routes

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Code pushed to GitHub (✅ Done!)
- [ ] Vercel account (create at vercel.com)
- [ ] Environment variables ready

---

## 🎯 Step-by-Step Deployment

### Step 1: Create Vercel Account (2 min)

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repos

### Step 2: Import Project (1 min)

1. Click **"Add New Project"**
2. Find **`apolmig/verificaya`** in the list
3. Click **"Import"**

### Step 3: Configure Build Settings (1 min)

Vercel will auto-detect Next.js. Verify these settings:

```
Framework Preset: Next.js
Build Command: next build
Output Directory: .next
Install Command: npm install
```

**⚠️ IMPORTANT:** Before clicking "Deploy", add environment variables!

### Step 4: Add Environment Variables (5 min)

Click **"Environment Variables"** and add:

#### Required (Minimum for Demo Mode):
```bash
# None required for demo mode!
# App works with mock data
```

#### For Production (Full Features):

**Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL=https://dhtklergxhybdzqinfqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Stripe:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Google Cloud (Optional - for OCR):**
```
GOOGLE_CLOUD_PROJECT_ID=tenant-screening-ocr
GOOGLE_CLOUD_CLIENT_EMAIL=tenant-screening-ocr@...
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Step 5: Deploy! (2 min)

1. Click **"Deploy"**
2. Wait 1-2 minutes for build
3. Get your URL: **`https://verificaya.vercel.app`**

---

## ✅ What Works Out of the Box

- ✅ Demo mode (no payment required)
- ✅ Landing page
- ✅ Blog (7 articles)
- ✅ Form submission
- ✅ Mock screenings
- ✅ PDF generation
- ✅ Responsive design
- ✅ All UI/UX features

## ⚠️ What Needs Config

- ⚠️ Real payments (add Stripe keys)
- ⚠️ Database (add Supabase keys)
- ⚠️ OCR (add Google Cloud keys)
- ⚠️ ASNEF (need API access)

---

## 🧪 Testing After Deploy

### Test 1: Landing Page
```
Visit: https://your-app.vercel.app
✅ Should load instantly
✅ All images load
✅ Mobile responsive
```

### Test 2: Demo Mode
```
Click: "🎯 Prueba Demo Gratis"
✅ Form loads
✅ Can submit
✅ See success page
```

### Test 3: Blog
```
Visit: https://your-app.vercel.app/blog
✅ 7 articles visible
✅ Can read posts
✅ Mobile responsive
```

---

## 🔧 Configure Stripe Webhook (Production)

After deploying, update Stripe webhook URL:

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click existing webhook or create new
3. Set URL to: `https://your-app.vercel.app/api/webhooks/stripe`
4. Copy new webhook secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 🎨 Custom Domain (Optional)

### Option A: Vercel Domain (Free)
```
Default: verificaya.vercel.app
Custom: verificaya-tenant-screening.vercel.app
```

### Option B: Your Domain
```
1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Vercel → Settings → Domains
3. Add domain: verificaya.com
4. Follow DNS instructions
5. Wait 1-24 hours for propagation
```

---

## 📊 Vercel Features You Get

### Free Tier Includes:
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments (per PR)
- ✅ Analytics (basic)
- ✅ 100GB bandwidth/month
- ✅ Serverless functions

### Auto-Deploy Setup:
```
Push to GitHub → Vercel builds → Live in 2 min
```

---

## 🐛 Troubleshooting

### Build Fails with Turbopack Error
**Fix:** Remove `--turbopack` from package.json build script

Before:
```json
"build": "next build --turbopack"
```

After:
```json
"build": "next build"
```

### API Routes Return 404
**Check:** Environment variables set correctly  
**Check:** Using App Router syntax (`app/api/*`)

### Images Not Loading
**Check:** Using Next.js Image component  
**Check:** Image domains configured in next.config.ts

### Supabase Connection Error
**Check:** NEXT_PUBLIC_SUPABASE_URL correct  
**Check:** SUPABASE_SERVICE_ROLE_KEY correct  
**Note:** App works without Supabase (mock data)

---

## 🎉 Success Checklist

After deployment:

- [ ] Landing page loads
- [ ] Demo mode works (no payment)
- [ ] Blog accessible
- [ ] Forms submit
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Custom domain (optional)
- [ ] Stripe webhook configured (for production)

---

## 💡 Pro Tips

1. **Preview Deployments:**
   - Every PR gets preview URL
   - Test before merging to main

2. **Environment Variables per Branch:**
   - Production: main branch
   - Preview: feature branches
   - Development: local only

3. **Analytics:**
   - Enable Vercel Analytics
   - See real user metrics
   - Free on Hobby plan

4. **Performance:**
   - Vercel optimizes images
   - Caches static assets
   - Edge functions globally

---

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Support: https://vercel.com/support

---

## 📞 Need Help?

1. Check Vercel build logs
2. Review deployment errors
3. Test locally first: `npm run build && npm start`
4. Contact Vercel support (responsive!)

---

**Estimated total time:** 5-10 minutes  
**Cost:** $0 (Free tier)  
**Result:** Live production app! 🎉
