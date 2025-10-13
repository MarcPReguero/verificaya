# 🚨 Netlify Deployment Troubleshooting

## Quick Fix: Environment Variables Missing

**Error Message:**
```
Error: Neither apiKey nor config.authenticator provided
Error: supabaseUrl is required.
```

**Root Cause:** 
Environment variables not configured in Netlify dashboard.

---

## ✅ Solution: Add Environment Variables

### Step 1: Access Netlify Environment Variables
1. Go to your Netlify dashboard
2. Select your site
3. Navigate to: **Site settings** → **Environment variables**
4. Click **"Add a variable"** or **"Add environment variables"**

### Step 2: Add Required Variables

**MINIMUM REQUIRED (to deploy successfully):**

| Variable Name | Where to Find | Example |
|--------------|---------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**REQUIRED FOR PAYMENTS:**

| Variable Name | Where to Find |
|--------------|---------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → Publishable key |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key |

### Step 3: Redeploy
1. After adding variables, click **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait 3-5 minutes for new build

---

## 📋 Complete Environment Variables Checklist

### Essential (Must Have)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key

### Optional (Add Later)
- [ ] `STRIPE_WEBHOOK_SECRET` - For Stripe webhook verification
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` - For OCR document scanning
- [ ] `ASNEF_API_KEY` - For real credit checks
- [ ] `ASNEF_API_URL` - ASNEF API endpoint

---

## 🔍 How to Get Credentials

### Supabase Credentials
1. Go to https://supabase.com/dashboard
2. Select your project (or create new one)
3. Click **Settings** (gear icon, bottom left)
4. Click **API** in the sidebar
5. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Stripe Credentials
1. Go to https://dashboard.stripe.com
2. Click **Developers** → **API keys**
3. Toggle to **Test mode** (for development)
4. Copy:
   - **Publishable key** (starts with `pk_test_`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (starts with `sk_test_`) → `STRIPE_SECRET_KEY`

**For Webhook Secret:**
1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter URL: `https://your-site.netlify.app/api/webhooks/stripe`
4. Select events: `checkout.session.completed`
5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 🐛 Other Common Issues

### Issue: Build still fails after adding variables
**Solution:**
1. Clear build cache: Site settings → Build & deploy → Clear cache
2. Trigger new deploy
3. Check build logs for new errors

### Issue: "Module not found" errors
**Solution:**
```bash
# Run locally to verify all dependencies
npm install
npm run build
```

### Issue: Turbopack errors
**Solution:** Already fixed - we removed `--turbopack` from build script

### Issue: Node version mismatch
**Solution:** netlify.toml already specifies Node 20.18.0

---

## 📱 Post-Deployment Checklist

After successful deployment:

- [ ] Visit your site URL (e.g., `https://verificaya.netlify.app`)
- [ ] Click **"Prueba Demo Gratis"** → Verify demo mode works
- [ ] Test WhatsApp button (bottom-right green button)
- [ ] Update WhatsApp phone number in `components/WhatsAppButton.tsx`
- [ ] Test payment flow (create real screening)
- [ ] Check Stripe webhook is receiving events
- [ ] Set up custom domain (if you have one)
- [ ] Enable HTTPS (automatic on Netlify)

---

## 💡 Tips

1. **Use Test Mode First:**
   - Use Stripe test keys (pk_test_, sk_test_)
   - Test all flows before switching to live mode

2. **Secure Your Keys:**
   - Never commit .env files to git
   - Rotate keys if accidentally exposed
   - Use environment-specific keys (dev/staging/prod)

3. **Monitor Deployments:**
   - Enable deploy notifications (Slack, email)
   - Check build logs for warnings
   - Set up error monitoring (Sentry, LogRocket)

---

## 🆘 Still Having Issues?

### Check Build Logs
1. Netlify Dashboard → Deploys → Click on failed deploy
2. Read full log for specific error messages
3. Look for missing packages or configuration

### Test Locally First
```bash
# Build locally to catch errors early
npm run build

# If build succeeds locally but fails on Netlify:
# - Check Node version (should be 20.18.0)
# - Verify all env vars are in Netlify
# - Check netlify.toml configuration
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| `supabaseUrl is required` | Add `NEXT_PUBLIC_SUPABASE_URL` in Netlify |
| `apiKey nor config.authenticator` | Add Stripe keys in Netlify |
| `Module not found` | Run `npm install` and commit package-lock.json |
| `Turbopack not supported` | Already fixed in package.json |

---

## 📞 Need Help?

1. Check Netlify docs: https://docs.netlify.com
2. Check Next.js docs: https://nextjs.org/docs
3. Ask in the conversation - I'm here to help! 🚀

---

**Remember:** The most common issue is missing environment variables. Add them in Netlify dashboard, redeploy, and you're good to go! ✅
