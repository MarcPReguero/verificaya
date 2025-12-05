
import { NextResponse } from 'next/server';
import { isOpenRouterConfigured } from '@/lib/ocr/openrouter-vision';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        services: {
            ocr: {
                provider: 'openrouter',
                configured: isOpenRouterConfigured(),
                model: 'google/gemini-2.0-flash-exp:free'
            },
            database: {
                status: 'mocked' // Currently mocked
            },
            stripe: {
                status: 'mocked' // Currently mocked
            }
        },
        env: process.env.NODE_ENV
    });
}
