
import { Resend } from 'resend';

// Helper to get API key safely
const getResendKey = () => {
    // Check various sources for the key
    return process.env.RESEND_API_KEY || '';
};

export const resend = new Resend(getResendKey());

export interface EmailOptions {
    to: string;
    subject: string;
    react: React.ReactElement;
    from?: string; // Optional custom sender
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, react, from }: EmailOptions) {
    const apiKey = getResendKey();

    if (!apiKey) {
        console.warn('⚠️ RESEND_API_KEY is missing. Email simulation:');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        return { success: false, error: 'Missing API Key', demo: true };
    }

    try {
        const defaultFrom = 'VerificaYa <onboarding@resend.dev>'; // Default testing domain

        const data = await resend.emails.send({
            from: from || defaultFrom,
            to,
            subject,
            react,
        });

        return { success: true, data };
    } catch (error: any) {
        console.error('❌ Failed to send email:', error);
        return { success: false, error: error.message };
    }
}
