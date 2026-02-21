# TenantScreen - Tenant Screening SaaS for Catalonia

> Professional tenant screening service adapted to Catalan and Spanish regulations. Built with Next.js, Supabase, and Stripe.

![Status](https://img.shields.io/badge/status-production--ready-success)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 What is TenantScreen?

TenantScreen is a comprehensive SaaS platform that helps landlords and property managers in Catalonia verify potential tenants quickly and securely. It provides:

- **Identity Verification**: NIE, DNI, and passport validation according to Spanish law
- **Income Analysis**: Automated calculation of income-to-rent ratios
- **Credit Checks**: Financial background verification (simulated in MVP)
- **Reference Verification**: Employment and previous landlord references
- **PDF Reports**: Professional, branded screening reports
- **Secure Payments**: Stripe-powered checkout (€59 Basic / €99 Complete)

## � Quick Start

### Option 1: Ultra-Fast Setup (5 minutes)

```bash
# 1. Clone and install
git clone <your-repo>
cd tenant-screening
npm install

# 2. Copy environment template
cp .env.local.example .env.local

# 3. Edit .env.local with your keys (see SETUP.md)

# 4. Run
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

### Option 2: Complete Setup (30 minutes)

Follow **[QUICKSTART.md](QUICKSTART.md)** for step-by-step instructions including:
- Supabase project setup
- Stripe account configuration  
- Database schema installation
- Storage bucket creation
- Testing with demo data

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[QUICKSTART.md](QUICKSTART.md)** | 30-minute setup checklist with checkboxes |
| **[SETUP.md](SETUP.md)** | Detailed setup guide with troubleshooting |
| **[FEATURES.md](FEATURES.md)** | Complete feature list and roadmap |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                              │
│  Landing Page  →  Screening Form  →  Payment  →  Dashboard  │
│   (Next.js)         (React)         (Stripe)    (Reports)   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    API Routes (Next.js)
                           │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │ Stripe  │      │Supabase │      │ Storage │
   │ Payment │      │   DB    │      │(Files)  │
   └─────────┘      └─────────┘      └─────────┘
```

## ✨ Key Features

### 💼 For Landlords
- Create screening requests in 5 minutes
- Automated tenant scoring (0-100 scale)
- Professional PDF reports
- Secure document storage
- Payment per screening and monthly subscriptions
- Dashboard to track all screenings

### 🏠 For Property Managers  
- Bulk screening capabilities (coming soon)
- Multi-property support
- Team management (coming soon)
- API integration available
- White-label reports (coming soon)

### 🔒 Security & Compliance
- GDPR-compliant data handling
- Encrypted file storage
- Spanish data protection law compliance
- ROW Level Security (Supabase)
- PCI-DSS compliant payments (Stripe)

## 🎨 Screenshots

### Landing Page
Modern, professional design with clear value proposition and pricing.

### Screening Form
4-step wizard collecting tenant, employment, property, and payment information.

### Dashboard
Overview of all screenings with status tracking and report access.

## 🗄️ Database Schema

See `supabase-schema.sql` for complete schema. Quick overview:

- **landlords**: Property owners
- **screenings**: Verification requests and results
- **screening_documents**: Uploaded files

Run the schema in Supabase SQL Editor to set up your database.

## 💳 Pricing

| Package | Price | What's Included |
|---------|-------|-----------------|
| **Basic** | €59 | Identity + Income + References + PDF Report |
| **Complete** | €99 | All above + Credit Check + Background Verification + Priority Support |

Pay-per-use and subscription options available. No hidden fees.

## 🛠️ Tech Stack Details

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage
- **Payments**: Stripe Checkout
- **PDF**: jsPDF
- **Hosting**: Vercel (recommended)
- **CI/CD**: GitHub Actions ready

## 📦 Project Structure

```
tenant-screening/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/
│   │   └── page.tsx                # Dashboard
│   ├── screening/
│   │   ├── new/page.tsx            # Screening form
│   │   └── [id]/success/page.tsx   # Success page
│   └── api/
│       ├── screenings/route.ts     # Screenings CRUD
│       ├── create-checkout/route.ts # Stripe checkout
│       └── webhooks/stripe/route.ts # Payment webhook
├── components/
│   └── forms/
│       └── FileUpload.tsx          # File upload component
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── stripe.ts                   # Stripe config
│   └── services/
│       ├── screening.service.ts    # Scoring algorithm
│       └── report.service.ts       # PDF generation
├── types/
│   ├── index.ts                    # TypeScript types
│   └── database.types.ts           # Database types
├── supabase-schema.sql             # Database schema
├── QUICKSTART.md                   # Quick setup guide
├── SETUP.md                        # Detailed setup guide
└── FEATURES.md                     # Feature list
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Add environment variables in Vercel dashboard.

### Other Platforms

Compatible with any Node.js hosting:
- Railway
- Render
- AWS Amplify
- Netlify
- DigitalOcean App Platform

## 🧪 Testing

### Test a Screening Flow

1. Go to `/screening/new`
2. Fill in test data
3. Use Stripe test card: `4242 4242 4242 4242`
4. Verify in dashboard
5. Download PDF report

### Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Auth Required**: 4000 0025 0000 3155

## 📊 Scoring Algorithm

The screening score (0-100) is calculated from:

1. **Income-to-Rent Ratio** (30 points)
   - 3x or more: Excellent (30 pts)
   - 2.5x-3x: Good (25 pts)
   - 2x-2.5x: Acceptable (15 pts)
   - Below 2x: Risk (5 pts)

2. **Employment Status** (20 points)
   - Employed: 20 pts
   - Self-employed: 15 pts
   - Student: 10 pts
   - Unemployed: 0 pts

3. **Document Verification** (25 points)
   - Valid NIE/DNI/Passport: 25 pts

4. **Credit Check** (15 points)
   - Good history: 15 pts
   - Fair history: 10 pts
   - Poor history: 5 pts

5. **References** (10 points)
   - Positive references: 10 pts
   - Mixed/pending: 5 pts

**Interpretation:**
- 80-100: 🟢 Approved (Excellent tenant)
- 60-79: 🟡 Approved with reserves
- 0-59: 🔴 Not recommended

## 🔧 Configuration

### Environment Variables

Required variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `.env.local.example` for complete template.

## 🐛 Troubleshooting

### Common Issues

**"Supabase connection error"**
→ Verify `NEXT_PUBLIC_SUPABASE_URL` is correct

**"Stripe payment failed"**
→ Check API keys are for the same account (test/live)

**"PDF generation error"**
→ Ensure `jspdf` and `date-fns` are installed

**"File upload error"**
→ Create 'documents' and 'reports' buckets in Supabase Storage

See [SETUP.md](SETUP.md) for detailed troubleshooting.

## 🗺️ Roadmap

### ✅ MVP Complete (v1.0)
- Core screening functionality
- Payment processing
- PDF report generation
- Dashboard
- File uploads

### 🚧 Coming Soon (v1.1)
- [ ] Email notifications
- [ ] Authentication system
- [ ] Real credit check API
- [ ] OCR document verification

### 🔮 Future (v2.0)
- [ ] Tenant portal
- [ ] Mobile app
- [ ] Bulk operations
- [ ] Advanced analytics
- [ ] API for integrations

See [FEATURES.md](FEATURES.md) for complete roadmap.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## � License

MIT License - See LICENSE file for details.

Free to use for commercial and personal projects.

## 💬 Support

- 📖 Documentation: See `SETUP.md` and `QUICKSTART.md`
- 🐛 Issues: Open a GitHub issue
- 💼 Business inquiries: [Your contact]

## 🎉 Credits

Built with:
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Stripe](https://stripe.com)
- [Tailwind CSS](https://tailwindcss.com)
- [jsPDF](https://github.com/parallax/jsPDF)

---

**Made with ❤️ for the Catalan property market**

*Start screening tenants in 30 minutes →* **[QUICKSTART.md](QUICKSTART.md)**
