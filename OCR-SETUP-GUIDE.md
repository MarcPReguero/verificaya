# 🔍 OCR Setup Guide - Google Cloud Vision API

Complete guide to enable document scanning (OCR) functionality in VerificaYa.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What You'll Need](#what-youll-need)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Environment Variables](#environment-variables)
5. [Testing OCR](#testing-ocr)
6. [Troubleshooting](#troubleshooting)
7. [Cost Estimation](#cost-estimation)

---

## 🎯 Overview

**What is OCR?**
Optical Character Recognition (OCR) automatically extracts text from images of identity documents (DNI, NIE, passports).

**What We Use:**
- **Google Cloud Vision API** - Industry-leading OCR accuracy
- **Document AI** - Specialized for identity documents
- **Text Detection** - Extracts all visible text

**Features:**
- ✅ Extract name, document number, dates from ID cards
- ✅ Detect document type (DNI, NIE, Passport)
- ✅ Face detection for photo verification
- ✅ Confidence scoring (quality check)
- ✅ Supports Spanish identity documents

---

## 📦 What You'll Need

- [ ] Google Cloud account (free tier available)
- [ ] Credit card (for verification - free tier won't charge)
- [ ] 15-20 minutes setup time
- [ ] Access to Netlify/Vercel dashboard (for env vars)

**Free Tier Limits:**
- **1,000 requests/month** - FREE
- After that: $1.50 per 1,000 requests
- Perfect for testing and small-scale use

---

## 🚀 Step-by-Step Setup

### **Step 1: Create Google Cloud Project (5 min)**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" (top bar)
   - Click "NEW PROJECT"
   - **Project name:** `verificaya-ocr` (or any name)
   - **Location:** No organization (leave default)
   - Click **"CREATE"**
   - Wait 10-15 seconds for project creation

3. **Select Your Project**
   - Make sure your new project is selected in the top bar
   - You should see "verificaya-ocr" displayed

---

### **Step 2: Enable Vision API (2 min)**

1. **Open API Library**
   - Visit: https://console.cloud.google.com/apis/library
   - Or: Navigation menu (☰) → APIs & Services → Library

2. **Search for Vision API**
   - Search box: Type "Cloud Vision API"
   - Click on **"Cloud Vision API"**

3. **Enable the API**
   - Click **"ENABLE"** button
   - Wait 10-20 seconds for activation
   - You should see "API enabled" confirmation

---

### **Step 3: Create Service Account (5 min)**

1. **Navigate to Service Accounts**
   - Visit: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Or: Navigation menu (☰) → IAM & Admin → Service Accounts

2. **Create Service Account**
   - Click **"+ CREATE SERVICE ACCOUNT"** (top of page)

3. **Service Account Details**
   - **Service account name:** `verificaya-ocr-service`
   - **Service account ID:** (auto-filled, e.g., `verificaya-ocr-service@...`)
   - **Description:** "OCR service for VerificaYa document scanning"
   - Click **"CREATE AND CONTINUE"**

4. **Grant Permissions**
   - **Select a role:** Search and select **"Cloud Vision AI Service Agent"**
   - Or: Use **"Owner"** for testing (more permissive)
   - Click **"CONTINUE"**

5. **Grant User Access**
   - Skip this step (optional)
   - Click **"DONE"**

---

### **Step 4: Create and Download Key (3 min)**

1. **Find Your Service Account**
   - You should see your new service account in the list
   - Email format: `verificaya-ocr-service@your-project-id.iam.gserviceaccount.com`

2. **Create JSON Key**
   - Click on your service account email (opens details)
   - Click **"KEYS"** tab
   - Click **"ADD KEY"** → **"Create new key"**

3. **Download Key**
   - Select **"JSON"** (should be pre-selected)
   - Click **"CREATE"**
   - A JSON file will download automatically
   - **IMPORTANT:** Save this file securely! It contains credentials.

4. **Review Downloaded File**
   - File name: `verificaya-ocr-[project-id]-[random].json`
   - Open in text editor
   - Should contain: `type`, `project_id`, `private_key_id`, `private_key`, `client_email`, etc.

---

### **Step 5: Extract Credentials (2 min)**

Open the downloaded JSON file and find these values:

```json
{
  "type": "service_account",
  "project_id": "verificaya-ocr-123456",           ← COPY THIS
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...",  ← COPY THIS
  "client_email": "verificaya-ocr-service@...",   ← COPY THIS
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

**You need:**
1. `project_id` - Your project ID
2. `private_key` - Long multi-line key (starts with `-----BEGIN PRIVATE KEY-----`)
3. `client_email` - Service account email

---

### **Step 6: Add to Environment Variables**

#### **For Local Development (.env.local)**

Create/edit `.env.local` in your project root:

```bash
# Google Cloud Vision API (OCR)
GOOGLE_CLOUD_PROJECT_ID=verificaya-ocr-123456
GOOGLE_CLOUD_CLIENT_EMAIL=verificaya-ocr-service@verificaya-ocr-123456.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...paste entire key here including newlines...
-----END PRIVATE KEY-----"
```

**⚠️ Important:**
- Keep the quotes around `GOOGLE_CLOUD_PRIVATE_KEY`
- Include the full key with `-----BEGIN` and `-----END` lines
- Preserve all newlines (`\n` characters)

#### **For Netlify**

1. Go to Netlify dashboard
2. Select your site
3. **Site settings** → **Environment variables**
4. Add these 3 variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `GOOGLE_CLOUD_PROJECT_ID` | `verificaya-ocr-123456` | Your project ID |
| `GOOGLE_CLOUD_CLIENT_EMAIL` | `verificaya-ocr-service@...` | Full email |
| `GOOGLE_CLOUD_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\nMIIE...` | **Keep as single line with `\n` for newlines** |

**For `GOOGLE_CLOUD_PRIVATE_KEY` in Netlify:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAAS...(rest of key)...-----END PRIVATE KEY-----\n
```
- Replace all actual newlines with `\n` (literal backslash-n)
- Keep it as one continuous string

#### **For Vercel**

1. Go to Vercel dashboard
2. Select your project
3. **Settings** → **Environment Variables**
4. Add the same 3 variables (Vercel handles multi-line keys better)

---

## 🧪 Testing OCR

### **Test 1: Check if OCR is Configured**

Visit your screening form:
```
https://verificaya.netlify.app/screening/new
```

If OCR is configured, you should see:
- ✅ Document upload section visible
- ✅ "Subir DNI/NIE" button active
- ✅ No "OCR not configured" errors

### **Test 2: Upload a Test Document**

1. **Create Test Image**
   - Take photo of your DNI/NIE
   - Or use a sample document image
   - Supported: JPG, PNG, WEBP (max 10MB)

2. **Upload Document**
   - Go to `/screening/new`
   - Click "Subir DNI/NIE"
   - Select your image
   - Wait 2-5 seconds for processing

3. **Verify Results**
   - Should see extracted text
   - Check if name/document number detected
   - Review confidence score (>0.8 is good)

### **Test 3: Check Browser Console**

```javascript
// Should NOT see these errors:
❌ "OCR service not configured"
❌ "Google Cloud credentials missing"

// Should see (when uploading):
✅ "Analyzing document..."
✅ "OCR analysis complete"
✅ Extracted data displayed
```

---

## 🐛 Troubleshooting

### **Error: "OCR service not configured"**

**Cause:** Environment variables missing or incorrect

**Solution:**
1. Check all 3 env vars are set:
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_CLOUD_CLIENT_EMAIL`
   - `GOOGLE_CLOUD_PRIVATE_KEY`
2. Verify no typos in variable names
3. Redeploy after adding variables

### **Error: "Vision API has not been enabled"**

**Cause:** API not enabled in Google Cloud Console

**Solution:**
1. Go to: https://console.cloud.google.com/apis/library
2. Search "Cloud Vision API"
3. Click **ENABLE**
4. Wait 30 seconds, try again

### **Error: "Invalid service account credentials"**

**Cause:** Incorrect private key format

**Solution:**
1. Re-download JSON key from Google Cloud
2. Copy entire `private_key` value including:
   - `-----BEGIN PRIVATE KEY-----`
   - All middle content
   - `-----END PRIVATE KEY-----`
3. For Netlify: Convert newlines to `\n`
4. Keep quotes around the value

### **Error: "Permission denied"**

**Cause:** Service account lacks permissions

**Solution:**
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click your service account
3. Click **PERMISSIONS** tab
4. Add role: **Cloud Vision AI Service Agent**
5. Or use: **Owner** (for testing)

### **Low Confidence Scores (<0.5)**

**Causes:**
- Poor image quality
- Blurry photo
- Bad lighting
- Document too small in frame

**Solutions:**
- Use high-resolution images (min 1200px wide)
- Ensure good lighting
- Crop to show only document
- Avoid shadows and glare

---

## 💰 Cost Estimation

### **Free Tier (First 1,000 requests/month)**
- **Cost:** $0 (FREE)
- **Covers:** ~33 documents per day
- **Perfect for:** Testing, MVP, small landlords

### **Paid Usage (After 1,000 requests)**
- **Cost:** $1.50 per 1,000 requests
- **Examples:**
  - 2,000 scans/month = $1.50
  - 5,000 scans/month = $6.00
  - 10,000 scans/month = $13.50

### **Expected Usage for VerificaYa**
- **Basic Package (€49):** 1 document scan
- **Complete Package (€99):** 2-3 document scans
- **50 verifications/month:** ~100 scans = FREE (under 1,000)
- **500 verifications/month:** ~1,000 scans = $0-1.50

**Cost per verification:** ~$0.001-0.003 (negligible)

---

## 📚 Additional Resources

### **Google Cloud Documentation**
- Vision API Overview: https://cloud.google.com/vision/docs
- Text Detection Guide: https://cloud.google.com/vision/docs/ocr
- Pricing Calculator: https://cloud.google.com/products/calculator

### **Our Implementation**
- OCR Service: `lib/ocr/google-vision.ts`
- Document Parser: `lib/ocr/document-parser.ts`
- API Endpoint: `app/api/ocr/analyze/route.ts`

### **Support**
- Google Cloud Support: https://cloud.google.com/support
- VerificaYa Issues: GitHub Issues tab

---

## ✅ Quick Checklist

Setup completion checklist:

- [ ] Google Cloud project created
- [ ] Cloud Vision API enabled
- [ ] Service account created
- [ ] JSON key downloaded
- [ ] Credentials extracted (project_id, client_email, private_key)
- [ ] Environment variables added to .env.local
- [ ] Environment variables added to Netlify/Vercel
- [ ] Site redeployed
- [ ] Test upload successful
- [ ] OCR extracting text correctly
- [ ] No console errors

---

## 🎉 Success!

Once all steps are complete:

**What Works:**
- ✅ Automatic text extraction from ID documents
- ✅ Name, document number, dates detected
- ✅ Face detection (if photo visible)
- ✅ Confidence scoring
- ✅ Support for DNI, NIE, Passports

**Next Steps:**
- Test with real documents
- Fine-tune document parsing rules
- Monitor usage in Google Cloud Console
- Set up billing alerts (recommended)

---

**Need Help?**
Check the troubleshooting section or review the code in:
- `lib/ocr/google-vision.ts` - API client
- `lib/ocr/document-parser.ts` - Text parsing logic
- `app/api/ocr/analyze/route.ts` - Upload endpoint

Good luck! 🚀
