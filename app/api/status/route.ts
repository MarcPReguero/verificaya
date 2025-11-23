
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
                model: 'qwen/qwen2.5-vl-32b-instruct:free'
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
