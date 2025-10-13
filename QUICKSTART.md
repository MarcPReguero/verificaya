# TenantScreen Quick Start Checklist

## ✅ Before You Begin

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## 🎯 30-Minute Setup

### Step 1: Supabase (10 minutes)

1. [ ] Create account at https://supabase.com
2. [ ] Create new project (wait 2 min)
3. [ ] Go to SQL Editor → New Query
4. [ ] Paste content from `supabase-schema.sql` → Run
5. [ ] Go to Storage → Create bucket `documents` (Private)
6. [ ] Go to Storage → Create bucket `reports` (Private)
7. [ ] Go to Settings → API → Copy these:
   - [ ] Project URL
   - [ ] Anon key
   - [ ] Service role key

### Step 2: Stripe (10 minutes)

1. [ ] Create account at https://stripe.com
2. [ ] Go to Developers → API keys
3. [ ] Copy these:
   - [ ] Publishable key (pk_test_...)
   - [ ] Secret key (sk_test_...)
4. [ ] For webhook secret (testing):
   - Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Copy the webhook secret (whsec_...)

### Step 3: Environment Setup (5 minutes)

1. [ ] Copy `.env.local.example` to `.env.local`
2. [ ] Fill in all the keys from steps 1 & 2
3. [ ] Save the file

### Step 4: Run the App (5 minutes)

1. [ ] Open terminal in project folder
2. [ ] Run: `npm install` (wait 1-2 min)
3. [ ] Run: `npm run dev` OR double-click `start-dev.bat`
4. [ ] Open: http://localhost:3000
5. [ ] Click "Iniciar Verificación"

## 🧪 Test It Works

### Create Test Screening

1. [ ] Fill form with test data:
   ```
   Name: Juan Test
   Email: test@example.com
   Phone: +34 600 000 000
   Document: NIE
   Number: X1234567L
   Income: 2500
   Rent: 800
   ```

2. [ ] Complete all 4 steps
3. [ ] Click "Iniciar Verificación y Pagar"
4. [ ] Use Stripe test card:
   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/25
   CVC: 123
   ```

5. [ ] Should redirect to success page ✅
6. [ ] Check Dashboard → See your screening
7. [ ] PDF report generated automatically

## 🚀 Deploy to Production (Optional)

### Using Vercel (Fastest)

1. [ ] Install Vercel CLI: `npm i -g vercel`
2. [ ] Run: `vercel`
3. [ ] Follow prompts
4. [ ] Add environment variables in Vercel dashboard
5. [ ] Update Stripe webhook URL to production
6. [ ] Done! 🎉

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `.env.local` | API keys & secrets |
| `supabase-schema.sql` | Database setup |
| `SETUP.md` | Detailed documentation |
| `README.md` | Project overview |
| `app/page.tsx` | Landing page |
| `app/screening/new/page.tsx` | Screening form |
| `app/dashboard/page.tsx` | Dashboard |
| `lib/services/screening.service.ts` | Scoring algorithm |
| `lib/services/report.service.ts` | PDF generation |

## 🆘 Common Issues

### "Supabase connection error"
➡️ Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

### "Stripe payment failed"
➡️ Make sure you're using test keys (pk_test_, sk_test_)

### "Cannot find module"
➡️ Run `npm install` again

### "Port 3000 already in use"
➡️ Kill other processes or use: `npm run dev -- -p 3001`

## 💡 Pro Tips

1. **Test Mode**: Always use Stripe test keys during development
2. **Database**: Check Supabase Table Editor to see data
3. **Logs**: Check browser console and terminal for errors
4. **Storage**: Verify buckets are created in Supabase Storage
5. **Webhook**: For local testing, keep Stripe CLI running

## 🎉 You're Done!

Your tenant screening SaaS is ready to:
- Accept screening requests
- Process payments
- Score tenants
- Generate PDF reports
- Store documents securely

## 📞 Need Help?

1. Read `SETUP.md` for detailed instructions
2. Check Supabase logs in dashboard
3. Check Stripe dashboard for payment issues
4. Review browser console for errors

---

**Estimated total setup time: 30 minutes** ⏱️

Happy screening! 🏠✨
