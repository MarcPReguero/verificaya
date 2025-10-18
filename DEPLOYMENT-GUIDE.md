# VerificaYa - Production Deployment Guide

**Estimated Time**: 30-45 minutes
**Difficulty**: Intermediate

This guide walks you through deploying VerificaYa to production step-by-step.

---

## Prerequisites

Before you begin, make sure you have:

- [ ] A Supabase account (free tier is fine)
- [ ] A Stripe account (test mode is fine for initial setup)
- [ ] A Netlify account (or Vercel - this guide uses Netlify)
- [ ] Git installed locally
- [ ] Node.js 18+ installed

---

## Part 1: Database Setup (15 minutes)

### Step 1.1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `verificaya` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `eu-west-1` for Europe)
4. Click "Create new project"
5. **Wait 2-3 minutes** for project to provision

### Step 1.2: Run Base Schema Migration

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `supabase-schema.sql` from your local project
4. **Copy the entire file** and paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. ✅ You should see: `Success. No rows returned`

### Step 1.3: Run ASNEF Migration

1. Click **New Query** again
2. Open `supabase-migration-asnef.sql`
3. **Copy and paste** into SQL editor
4. Click **Run**
5. ✅ You should see: `Migration completed successfully!`

### Step 1.4: Run New Fields Migration ⚠️ CRITICAL

1. Click **New Query** again
2. Open `database-migration-new-fields.sql`
3. **Copy and paste** the entire file
4. Click **Run**
5. ✅ Scroll down to see verification query results
6. **Expected output**: Should show 12+ columns added

**Verify Migration Worked**:
```sql
-- Run this query to verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'screenings'
  AND column_name IN ('risk_level', 'fraud_flags', 'explanation', 'employment_years')
ORDER BY column_name;
```

Expected result: 4 rows showing the new columns.

### Step 1.5: Get Supabase API Keys

1. Go to **Settings** > **API** (left sidebar)
2. **Copy these values** (you'll need them soon):
   - `Project URL` (e.g., `https://abcdefgh.supabase.co`)
   - `anon public` key (starts with `eyJ...`)
   - `service_role` key (starts with `eyJ...`) ⚠️ **Keep this secret!**

---

## Part 2: Storage Buckets Setup (10 minutes)

### Step 2.1: Create Storage Buckets

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Click **Create bucket**

#### Bucket 1: Documents
- **Name**: `documents`
- **Public**: ❌ OFF (unchecked)
- **File size limit**: `10485760` (10 MB)
- **Allowed MIME types**:
  ```
  image/jpeg
  image/png
  image/jpg
  application/pdf
  ```
- Click **Create bucket**

#### Bucket 2: Reports
- **Name**: `reports`
- **Public**: ❌ OFF (unchecked)
- **File size limit**: `5242880` (5 MB)
- **Allowed MIME types**:
  ```
  application/pdf
  ```
- Click **Create bucket**

### Step 2.2: Configure Storage Policies

1. Go back to **SQL Editor**
2. Click **New Query**
3. Open `supabase-storage-setup.sql`
4. **Copy and paste** entire file
5. Click **Run**
6. ✅ You should see: `Storage bucket policies configured successfully!`

**Verify Policies**:
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname LIKE '%documents%' OR policyname LIKE '%reports%')
ORDER BY policyname;
```

Expected: 6 policies.

---

## Part 3: Stripe Setup (10 minutes)

### Step 3.1: Get Stripe API Keys

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top right)
3. Go to **Developers** > **API keys**
4. **Copy these values**:
   - `Publishable key` (starts with `pk_test_...`)
   - `Secret key` (starts with `sk_test_...`) ⚠️ **Keep this secret!**

### Step 3.2: Create Stripe Webhook

1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Fill in:
   - **Endpoint URL**: `https://your-site.netlify.app/api/webhooks/stripe`
     - ⚠️ Replace `your-site` with your actual Netlify domain (you'll get this in Part 4)
     - For now, use: `https://TEMPORARY.netlify.app/api/webhooks/stripe`
   - **Description**: `VerificaYa payment webhook`
   - **Events to send**: Click **Select events**
     - Search for: `checkout.session.completed`
     - Check the box
     - Click **Add events**
4. Click **Add endpoint**
5. **Click on the webhook** you just created
6. **Copy the Signing secret** (starts with `whsec_...`) ⚠️ **Keep this secret!**

---

## Part 4: Netlify Deployment (10 minutes)

### Step 4.1: Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for production"

# Create GitHub repo and push
# (Follow GitHub instructions to create repo)
git remote add origin https://github.com/YOUR_USERNAME/verificaya.git
git push -u origin master
```

### Step 4.2: Connect to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **Add new site** > **Import an existing project**
3. Choose **GitHub**
4. Authorize Netlify to access your GitHub
5. Select your `verificaya` repository
6. **Build settings**:
   - **Branch to deploy**: `master` (or `main`)
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
7. **DO NOT deploy yet!** - Click **Advanced** first

### Step 4.3: Configure Environment Variables

Click **Add environment variable** and add each of these:

#### Supabase Variables
```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Stripe Variables
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_51...
STRIPE_SECRET_KEY = sk_test_51...
STRIPE_WEBHOOK_SECRET = whsec_...
```

#### App Variables
```
NEXT_PUBLIC_APP_URL = https://your-site.netlify.app
NODE_ENV = production
```

⚠️ **Replace with your actual values from Steps 1.5 and 3.1-3.2!**

### Step 4.4: Deploy!

1. Click **Deploy site**
2. Wait 3-5 minutes for build to complete
3. ✅ You should see **"Site is live"**
4. Click on the site URL (e.g., `https://random-name-123.netlify.app`)

### Step 4.5: Update Stripe Webhook URL

1. Go back to Stripe Dashboard > Webhooks
2. Click on your webhook endpoint
3. Click **Update details**
4. Change URL from `TEMPORARY` to your actual Netlify URL:
   - `https://your-actual-site.netlify.app/api/webhooks/stripe`
5. Click **Update endpoint**

---

## Part 5: Verification & Testing (5 minutes)

### Test 1: Database Connection

1. Open your deployed site
2. Open browser DevTools (F12)
3. Go to Console
4. You should NOT see any Supabase errors

### Test 2: Create a Test Screening

1. Go to `/screening/new` on your site
2. Fill in the form with test data:
   - **Tenant Name**: Ana García López
   - **Email**: test@example.com
   - **Phone**: +34 600 000 000
   - **Document**: DNI
   - **Document Number**: 12345678A
   - **Monthly Income**: 3000
   - **Employment**: Employed
   - **Employment Years**: 3
   - **Contract Type**: Indefinido
   - **Property Address**: Calle Gran Vía, 123, Barcelona
   - **Monthly Rent**: 1000
3. Add a reference:
   - **Type**: Employer
   - **Name**: Previous Company
   - **Phone**: +34 600 111 222
4. Continue to payment
5. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
6. Click **Pay**

### Test 3: Verify Data in Supabase

1. Go to Supabase Dashboard > **Table Editor**
2. Select `screenings` table
3. Find your test screening
4. **Verify these columns exist and have data**:
   - ✅ `risk_level` (should be 'low', 'medium', 'high', or 'very_high')
   - ✅ `fraud_flags` (should be `[]` or contain fraud flags)
   - ✅ `explanation` (should be JSON object)
   - ✅ `employment_years` (should be 3)
   - ✅ `contract_type` (should be 'indefinido')
   - ✅ `references` (should be JSON array)

### Test 4: Check Dashboard

1. Go to `/dashboard` on your site
2. You should see your test screening
3. Click to expand the screening
4. **Verify you see**:
   - ✅ Risk level badge
   - ✅ Positive factors (if any)
   - ✅ Negative factors (if any)
   - ✅ Improvement suggestions

### Test 5: Download PDF Report

1. In dashboard, click **Download Report**
2. Open the PDF
3. **Verify PDF contains**:
   - ✅ Score and risk level badge
   - ✅ Tenant information
   - ✅ Positive factors breakdown
   - ✅ Negative factors breakdown
   - ✅ GDPR improvement suggestions
   - ✅ Human review notice

---

## Part 6: Go Live with Real Stripe (Optional)

### When you're ready for real payments:

1. **Stripe Dashboard** > Toggle from **Test mode** to **Live mode**
2. Go to **Developers** > **API keys**
3. Copy the **Live keys**:
   - `pk_live_...`
   - `sk_live_...`
4. Create new webhook for live mode:
   - URL: `https://your-site.netlify.app/api/webhooks/stripe`
   - Event: `checkout.session.completed`
   - Copy `whsec_...` signing secret
5. **Netlify Dashboard** > **Site settings** > **Environment variables**
6. **Update these 3 variables**:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
   STRIPE_SECRET_KEY = sk_live_...
   STRIPE_WEBHOOK_SECRET = whsec_... (new live webhook secret)
   ```
7. Go to **Deploys** > **Trigger deploy**
8. ✅ You're now live with real payments!

---

## Troubleshooting

### Error: "Supabase connection error"

**Solution**:
1. Check environment variables in Netlify are correct
2. Make sure `NEXT_PUBLIC_SUPABASE_URL` starts with `https://`
3. Verify Supabase project is not paused (free tier pauses after inactivity)

### Error: "Database migration failed"

**Solution**:
1. Check SQL syntax in migration file
2. Run migrations in correct order:
   - `supabase-schema.sql` first
   - `supabase-migration-asnef.sql` second
   - `database-migration-new-fields.sql` third
3. Check for existing tables/columns (use `DROP TABLE IF EXISTS`)

### Error: "Stripe payment failed"

**Solution**:
1. Verify webhook URL matches your Netlify URL exactly
2. Check webhook secret is correct in environment variables
3. Make sure test/live mode keys match (don't mix them!)
4. Check Stripe Dashboard > Logs for error details

### Error: "Storage bucket not found"

**Solution**:
1. Create buckets manually in Supabase Dashboard > Storage
2. Run `supabase-storage-setup.sql` after buckets exist
3. Verify bucket names are exactly: `documents` and `reports`

### Dashboard shows incomplete data

**Solution**:
1. Run `database-migration-new-fields.sql` migration
2. Verify columns exist:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'screenings' AND column_name LIKE '%risk%';
   ```
3. If columns missing, re-run migration

### PDF missing new sections

**Solution**:
1. Check screening has `explanation`, `fraudFlags`, `riskLevel` data
2. Verify latest code is deployed (check git commit hash)
3. Clear browser cache and try again

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Test complete screening flow end-to-end
- [ ] Verify all new database fields populated
- [ ] Check PDF report contains all new sections
- [ ] Test dashboard expandable details
- [ ] Verify Stripe webhook receives events (check Stripe logs)
- [ ] Set up domain (optional): Netlify > Domain settings
- [ ] Enable SSL (should be automatic on Netlify)
- [ ] Add uptime monitoring (UptimeRobot, etc.)
- [ ] Set up error tracking (Sentry - optional)
- [ ] Configure backups (Supabase auto-backups enabled)

---

## Need Help?

- **Supabase Issues**: https://supabase.com/docs
- **Stripe Issues**: https://stripe.com/docs
- **Netlify Issues**: https://docs.netlify.com
- **Code Issues**: Check `PRODUCTION-READINESS-REPORT.md`

---

## Next Steps

1. **Monitor First Week**:
   - Check Netlify logs daily
   - Monitor Stripe dashboard for payments
   - Check Supabase database for data integrity

2. **Add Recommended Enhancements**:
   - Sentry error tracking (see `PRODUCTION-READINESS-REPORT.md`)
   - Rate limiting
   - Email notifications

3. **Scale**:
   - Once you have 100+ screenings, review database performance
   - Consider adding Redis caching
   - Upgrade Supabase plan if needed

---

**Congratulations! VerificaYa is now live! 🚀**
