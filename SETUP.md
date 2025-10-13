# 🚀 TenantScreen - Setup Guide

## Complete Production Setup Instructions

### 📋 Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works!)
- Stripe account
- Git installed

---

## 🗄️ Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create account
2. Click "New Project"
3. Choose a name (e.g., "tenant-screening")
4. Set a strong database password (save it!)
5. Choose region (closest to Spain: Frankfurt)
6. Click "Create new project" (takes ~2 minutes)

### 1.2 Run Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the entire content from `supabase-schema.sql`
4. Click "Run" to execute
5. Verify tables were created under **Table Editor**

### 1.3 Create Storage Buckets

1. Go to **Storage** in sidebar
2. Create bucket named `documents`
   - Set to **Private**
   - Go to Policies > New Policy
   - Template: "Allow authenticated uploads"
   - Click Review & Save

3. Create bucket named `reports`
   - Set to **Private**
   - Go to Policies > New Policy
   - Template: "Allow service role access"
   - Click Review & Save

### 1.4 Get API Keys

1. Go to **Settings** > **API**
2. Copy these values (you'll need them):
   - Project URL: `https://xxxxx.supabase.co`
   - Anon/public key: `eyJhb...`
   - Service role key: `eyJhb...` (⚠️ Keep secret!)

---

## 💳 Step 2: Stripe Setup

### 2.1 Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete business verification (can skip for testing)
3. Go to **Developers** > **API keys**

### 2.2 Get API Keys

1. Copy **Publishable key** (starts with `pk_test_`)
2. Copy **Secret key** (starts with `sk_test_`)
3. Save both securely

### 2.3 Set Up Webhook (for production)

1. Go to **Developers** > **Webhooks**
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events: `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_`)

For local testing:
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook secret it provides
```

---

## ⚙️ Step 3: Environment Variables

### 3.1 Copy Template

```bash
cp .env.local.example .env.local
```

### 3.2 Fill in Values

Open `.env.local` and add your keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🏃 Step 4: Run Locally

### 4.1 Install Dependencies

```bash
npm install
```

### 4.2 Start Development Server

```bash
npm run dev
# OR
.\start-dev.bat
```

### 4.3 Open Browser

Go to [http://localhost:3000](http://localhost:3000)

---

## 🧪 Step 5: Test the Flow

### 5.1 Create a Test Screening

1. Click "Iniciar Verificación"
2. Fill in test data:
   - Name: Juan Test
   - Email: test@example.com
   - Phone: +34 600 000 000
   - NIE: X1234567L
   - Income: 2500
   - Rent: 800
3. Complete all steps
4. Click "Iniciar Verificación y Pagar"

### 5.2 Test Stripe Payment

1. You'll be redirected to Stripe Checkout
2. Use test card: `4242 4242 4242 4242`
3. Expiry: Any future date (e.g., 12/25)
4. CVC: Any 3 digits (e.g., 123)
5. Click "Pay"

### 5.3 View Results

1. You'll be redirected to success page
2. Screening will be processed
3. Check dashboard at `/dashboard`
4. PDF report generated automatically

---

## 🚀 Step 6: Deploy to Production

### 6.1 Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Follow prompts:
- Set up project? **Yes**
- Link to existing? **No**
- Name: **tenant-screening**
- Deploy

### 6.2 Add Environment Variables

1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add all variables from `.env.local`
5. Redeploy

### 6.3 Update Stripe Webhook

1. Go to Stripe webhooks
2. Update endpoint URL to: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Copy new webhook secret
4. Update in Vercel environment variables

### 6.4 Update Supabase URL

1. Update `NEXT_PUBLIC_APP_URL` in Vercel
2. Set to: `https://your-domain.vercel.app`

---

## 📊 Usage

### Creating a Screening

```typescript
POST /api/screenings
{
  "tenantName": "Juan García",
  "tenantEmail": "juan@email.com",
  "documentType": "NIE",
  "documentNumber": "X1234567L",
  "monthlyIncome": 2500,
  "monthlyRent": 800,
  ...
}
```

### Processing a Screening

```typescript
POST /api/screenings/{id}/process
// Returns score and generates PDF report
```

### Uploading Documents

Use the `FileUpload` component:

```tsx
<FileUpload
  screeningId={screeningId}
  documentType="payslip"
  label="Nómina"
  onUploadComplete={(url) => console.log(url)}
/>
```

---

## 🎯 Key Features Implemented

✅ **Landing Page** - Marketing site with pricing
✅ **Multi-step Form** - Tenant screening request form
✅ **Stripe Payments** - Secure checkout integration
✅ **Supabase Database** - PostgreSQL with RLS
✅ **File Upload** - Document storage in Supabase
✅ **Scoring Algorithm** - Smart tenant evaluation
✅ **PDF Reports** - Automated report generation
✅ **Dashboard** - View all screenings
✅ **TypeScript** - Full type safety
✅ **Responsive Design** - Mobile-friendly UI

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use service role key only in API routes** - Never expose to client
3. **Enable RLS in Supabase** - Already configured in schema
4. **Verify Stripe webhooks** - Signature verification implemented
5. **Validate all inputs** - Document format validation included

---

## 📝 Next Steps for Production

### High Priority

- [ ] Add authentication (Supabase Auth)
- [ ] Implement email notifications (Resend/SendGrid)
- [ ] Add document verification AI (Azure AI Vision)
- [ ] Integrate real credit check API
- [ ] Add landlord profile management
- [ ] Implement tenant consent flow
- [ ] Add GDPR compliance features

### Nice to Have

- [ ] Multi-language support (Catalan/Spanish/English)
- [ ] Bulk screening uploads
- [ ] Export to Excel/CSV
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] API for property management systems
- [ ] Tenant portal
- [ ] Automated reference checks

---

## 🐛 Troubleshooting

### Supabase Connection Error

```
Error: Invalid Supabase URL
```
**Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

### Stripe Payment Failed

```
Error: No such customer
```
**Solution**: Ensure `STRIPE_SECRET_KEY` is set correctly

### PDF Generation Error

```
Error: jsPDF is not defined
```
**Solution**: Run `npm install jspdf date-fns`

### File Upload Error

```
Error: Bucket not found
```
**Solution**: Create 'documents' and 'reports' buckets in Supabase Storage

---

## 📞 Support

For issues or questions:
1. Check the README.md
2. Review Supabase logs
3. Check Stripe dashboard for payment issues
4. Open an issue on GitHub

---

## 📄 License

MIT License - Feel free to use for your business!

---

**🎉 Congratulations! Your tenant screening SaaS is ready to go!**
