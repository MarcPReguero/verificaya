# VerificaYa - 5 Critical Steps to Production

**Time Required**: 30 minutes
**What I Can Do**: ✅ Prepare files | **What You Must Do**: ⚠️ Configure external services

---

## ✅ What I've Already Done For You

I've created all the necessary files and scripts:

1. ✅ **Database Migration Scripts**
   - `database-migration-new-fields.sql` (218 lines - adds all new fields)
   - `supabase-schema.sql` (base schema)
   - `supabase-migration-asnef.sql` (credit check fields)
   - `supabase-storage-setup.sql` (storage bucket policies)

2. ✅ **Configuration Files**
   - `.env.example` (template for environment variables)
   - `lib/env.ts` (automatic environment validation)

3. ✅ **Setup Tools**
   - `scripts/verify-setup.js` (automated verification)
   - `DEPLOYMENT-GUIDE.md` (detailed step-by-step guide)
   - `PRODUCTION-READINESS-REPORT.md` (77-page assessment)

4. ✅ **Enhanced Code**
   - PDF reports with GDPR explanations
   - Dashboard with risk levels and fraud detection
   - Form with employment stability and references
   - API endpoints with all new fields

---

## ⚠️ The 5 Critical Steps YOU Must Complete

### Step 1: Create Supabase Project (5 min)

**Why You Must Do This**: I can't create accounts or access external services.

**What To Do**:
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: `verificaya`
4. Choose region closest to your users
5. **Save the database password!**
6. Wait 2-3 minutes for setup

**Get These Values**:
- Go to Settings > API
- Copy: `Project URL`, `anon public` key, `service_role` key

---

### Step 2: Run Database Migrations (10 min)

**Why You Must Do This**: I can't access your Supabase dashboard.

**What To Do**:

1. **Open Supabase SQL Editor**:
   - In your Supabase project > SQL Editor (left sidebar)
   - Click "New Query"

2. **Run Migration 1** - Base Schema
   ```bash
   # Copy the entire file: supabase-schema.sql
   # Paste into SQL Editor
   # Click "Run"
   ```

3. **Run Migration 2** - ASNEF Fields
   ```bash
   # Copy the entire file: supabase-migration-asnef.sql
   # Paste into SQL Editor
   # Click "Run"
   ```

4. **Run Migration 3** - NEW FIELDS ⚠️ CRITICAL
   ```bash
   # Copy the entire file: database-migration-new-fields.sql
   # Paste into SQL Editor
   # Click "Run"
   ```

5. **Verify**:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'screenings'
     AND column_name IN ('risk_level', 'fraud_flags', 'explanation');
   ```
   **Expected**: 3 rows

---

### Step 3: Create Storage Buckets (5 min)

**Why You Must Do This**: Storage buckets must be created via Supabase UI.

**What To Do**:

1. **In Supabase Dashboard > Storage**:
   - Click "Create bucket"

2. **Bucket 1: documents**
   - Name: `documents`
   - Public: ❌ OFF
   - File size limit: `10485760` (10 MB)
   - MIME types: `image/jpeg, image/png, application/pdf`

3. **Bucket 2: reports**
   - Name: `reports`
   - Public: ❌ OFF
   - File size limit: `5242880` (5 MB)
   - MIME types: `application/pdf`

4. **Run Storage Policies**:
   ```bash
   # Go back to SQL Editor
   # Copy the entire file: supabase-storage-setup.sql
   # Paste and Run
   ```

---

### Step 4: Configure Stripe (5 min)

**Why You Must Do This**: I can't access your Stripe account.

**What To Do**:

1. **Go to https://dashboard.stripe.com**
2. **Switch to Test mode** (toggle top-right)
3. **Get API Keys**:
   - Developers > API keys
   - Copy: `Publishable key` (pk_test_...), `Secret key` (sk_test_...)

4. **Create Webhook**:
   - Developers > Webhooks > Add endpoint
   - URL: `https://PLACEHOLDER.netlify.app/api/webhooks/stripe` (change later)
   - Event: `checkout.session.completed`
   - Copy: `Signing secret` (whsec_...)

---

### Step 5: Deploy to Netlify (5 min)

**Why You Must Do This**: I can't push to your GitHub or deploy to Netlify.

**What To Do**:

1. **Create .env.local** (local testing):
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values from Steps 1 & 4
   ```

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin master
   ```

3. **Connect Netlify**:
   - Go to https://app.netlify.com
   - "Add new site" > "Import from GitHub"
   - Select your repo
   - **DON'T deploy yet!**

4. **Add Environment Variables in Netlify**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = [from Step 1]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [from Step 1]
   SUPABASE_SERVICE_ROLE_KEY = [from Step 1]
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = [from Step 4]
   STRIPE_SECRET_KEY = [from Step 4]
   STRIPE_WEBHOOK_SECRET = [from Step 4]
   NEXT_PUBLIC_APP_URL = https://your-site.netlify.app
   NODE_ENV = production
   ```

5. **Deploy**:
   - Click "Deploy site"
   - Wait 3-5 minutes
   - Copy your Netlify URL

6. **Update Stripe Webhook**:
   - Back to Stripe > Webhooks
   - Edit your webhook URL
   - Change `PLACEHOLDER` to your actual Netlify URL
   - Save

---

## ✅ Verification

Run this command locally to check setup:

```bash
npm run verify-setup
```

**Should show**: `✅ All checks passed! Ready for deployment.`

---

## 🧪 Test Complete Flow

1. Go to your deployed site
2. Create a test screening at `/screening/new`
3. Fill in:
   - Employment years: `3`
   - Contract type: `Indefinido`
   - Add a reference (employer or landlord)
4. Use test card: `4242 4242 4242 4242`
5. Check dashboard - should show risk level and fraud detection
6. Download PDF - should have all new sections

---

## 🆘 I Can't Do These (You Must Do Manually)

| Task | Why I Can't | Who Can |
|------|-------------|---------|
| Create Supabase account | No access to external services | You |
| Run SQL migrations | Can't access your dashboard | You |
| Create storage buckets | Must be done in Supabase UI | You |
| Get Stripe API keys | Can't access your account | You |
| Configure Netlify | Need GitHub push access | You |
| Test with real payment | Need valid card | You |

---

## 📚 Full Documentation

- **Detailed Guide**: [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) (step-by-step with troubleshooting)
- **Production Assessment**: [PRODUCTION-READINESS-REPORT.md](PRODUCTION-READINESS-REPORT.md) (77-page review)
- **Environment Template**: [.env.example](.env.example) (copy and fill in)

---

## ⚡ What I've Automated For You

✅ **Database Schema**
- All tables, indexes, constraints ready
- RLS policies configured
- Migration scripts prepared

✅ **Code Features**
- Advanced scoring algorithm
- GDPR-compliant explanations
- Fraud detection (4 types)
- PDF reports with all new sections
- Dashboard with expandable details

✅ **Environment Validation**
- Automatic checks in `lib/env.ts`
- Setup verification script
- Error messages guide you to fixes

✅ **Documentation**
- Step-by-step deployment guide
- Production readiness report
- This quick-start guide

---

## 🎯 Summary

**What I Did**:
- ✅ Wrote all database migrations
- ✅ Created all configuration files
- ✅ Built advanced features (fraud detection, GDPR, scoring)
- ✅ Generated comprehensive documentation

**What You Do**:
1. ⚠️ Create Supabase project (5 min)
2. ⚠️ Run 3 database migrations (10 min)
3. ⚠️ Create 2 storage buckets (5 min)
4. ⚠️ Configure Stripe (5 min)
5. ⚠️ Deploy to Netlify (5 min)

**Total Time**: 30 minutes

---

## 🚀 Ready to Deploy?

```bash
# 1. Check everything is ready
npm run verify-setup

# 2. Test locally first
npm run dev
# Visit http://localhost:3000

# 3. Follow the 5 steps above

# 4. Celebrate! 🎉
```

---

**Questions?** See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for detailed help.
