
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function verifyEmail() {
    console.log('\n📧 Email Verification Script\n');
    console.log('='.repeat(50));

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('❌ RESEND_API_KEY is missing in .env.local');
        process.exit(1);
    }

    console.log('✅ API Key found');

    try {
        const { sendEmail } = await import('../lib/email');
        const ScreeningCompletedEmail = (await import('../components/emails/ScreeningCompletedEmail')).default;

        // Send to a test address (or the one in RESEND_FROM if strictly required by trial)
        // For Resend trial, you can only send to your own email unless domain is verified.
        const testEmail = 'delivered@resend.dev';
        console.log(`\n📤 Sending test email to: ${testEmail}...`);

        const result = await sendEmail({
            to: testEmail,
            subject: '🧪 Test Email from VerificaYa',
            react: ScreeningCompletedEmail({
                landlordName: 'Test User',
                tenantName: 'Test Tenant',
                score: 95,
                reportUrl: 'https://example.com/report.pdf',
                documentId: 'TEST-123'
            })
        });

        if (result.success) {
            console.log('\n✅ Email sent successfully!');
            console.log('   ID:', result.data?.id);
            console.log('   Check your Resend dashboard or inbox.');
        } else {
            console.error('\n❌ Failed to send email:', result.error);
        }

    } catch (error: any) {
        console.error('\n❌ Unexpected error:', error.message);
    }
}

verifyEmail().catch(console.error);
