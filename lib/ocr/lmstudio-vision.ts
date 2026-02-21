
/**
 * LM Studio Local Vision API Client
 * Uses local LLMs via LM Studio for OCR
 */

export interface OCRResult {
    success: boolean;
    text: string;
    data?: unknown;
    error?: string;
}

type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
type Message = { role: 'user'; content: ContentPart[] };
type LLMResponse = { choices?: Array<{ message?: { content?: string } }> };

/**
 * Analyze document using LM Studio local API
 * @param imageBuffer - Image file buffer
 * @param mimeType - Image mime type
 * @param documentType - Type of document to analyze (IDENTITY, PAYSLIP, CONTRACT)
 */
export async function analyzeDocumentWithLMStudio(
    imageBuffer: Buffer,
    mimeType: string,
    documentType: 'IDENTITY' | 'PAYSLIP' | 'CONTRACT' = 'IDENTITY'
): Promise<OCRResult> {
    try {
        const apiEndpoint = process.env.LMSTUDIO_API_URL || 'http://localhost:1234/v1/chat/completions';
        console.log(`[LM Studio] Using API at ${apiEndpoint}`);

        // Handle PDF text extraction
        let extractedText = '';

        if (mimeType === 'application/pdf') {
            console.log('[LM Studio] Processing PDF document...');
            try {
                const { extractTextFromPdf } = require('./pdf-utils');
                extractedText = await extractTextFromPdf(imageBuffer);
                console.log('[LM Studio] PDF Text extraction successful. Text length:', extractedText.length);
            } catch (pdfError) {
                console.error('[LM Studio] PDF Processing failed:', pdfError);
                throw pdfError;
            }
        }

        // Select prompt based on document type
        let prompt = '';

        switch (documentType) {
            case 'PAYSLIP':
                prompt = `You are an expert OCR system specialized in Spanish Payslips (Nóminas).

${extractedText ? 'Analyze the following text extracted from a PDF payslip' : 'Carefully examine this payslip image'} and extract ALL visible information.

CRITICAL INSTRUCTIONS:
- Extract EXACTLY what you see, do not invent or assume data.
- For monetary amounts, extract ONLY the number (no € symbol, no text). Use a dot (.) for decimals.
- For dates, use DD/MM/YYYY format.
- If a field is not visible or unclear, use null.
- Return ONLY valid JSON, no markdown, no explanations.

REQUIRED FIELDS:
{
  "type": "PAYSLIP",
  "employerName": "Company name as shown on document",
  "employeeName": "Full employee name",
  "netIncome": 1234.56,  // LÍQUIDO A PERCIBIR, LÍQUIDO TOTAL, or similar. The final amount to receive.
  "grossIncome": 2000.00,  // TOTAL DEVENGADO, TOTAL BRUTO. The total earned before deductions.
  "period": "Month YYYY",  // e.g., "Enero 2024", "01/2024". The period covered by the payslip.
  "seniorityDate": "DD/MM/YYYY"  // ANTIGÜEDAD, FECHA DE ALTA. Employee start date.
}

IMPORTANT TIPS:
- "LÍQUIDO A PERCIBIR" is the most important field for netIncome.
- "TOTAL DEVENGADO" is the most important field for grossIncome.
- Ensure numbers are parsed correctly (e.g. 1.234,56 should be 1234.56).
- If multiple dates appear, look for "Antigüedad" for seniority.

Return the JSON now:`;
                break;

            case 'CONTRACT':
                prompt = `You are an expert OCR system specialized in Spanish Rental Contracts (Contratos de Arrendamiento).

${extractedText ? 'Analyze the following text extracted from a PDF contract' : 'Carefully examine this contract image'} and extract ALL visible information.

CRITICAL INSTRUCTIONS:
- Extract EXACTLY what you see, do not invent or assume data.
- For monetary amounts, extract ONLY the number (no € symbol). Use a dot (.) for decimals.
- For dates, use DD/MM/YYYY format.
- If a field is not visible or unclear, use null.
- Return ONLY valid JSON, no markdown, no explanations.

REQUIRED FIELDS:
{
  "type": "CONTRACT",
  "landlordName": "Arrendador full name (person or company)",
  "tenantName": "Arrendatario full name (person or company)",
  "propertyAddress": "Complete address of the rented property",
  "monthlyRent": 850.00,  // Monthly rent amount (number only).
  "startDate": "DD/MM/YYYY",  // Contract start date.
  "duration": "Duration text"  // e.g., "1 año", "indefinido", "5 años".
}

IMPORTANT TIPS:
- Look for "Reunidos" or "Intervienen" sections to find names.
- "ARRENDADOR" is the owner/landlord.
- "ARRENDATARIO" is the tenant.
- "RENTA" or "PRECIO" usually indicates the monthly rent.
- "DURACIÓN" or "ESTIPULACIONES" section contains the start date and duration.

Return the JSON now:`;
                break;

            case 'IDENTITY':
            default:
                prompt = `You are an expert OCR system specialized in Spanish identity documents (DNI, NIE, Passport).

${extractedText ? 'Analyze the following text extracted from a PDF identity document' : 'Carefully examine this identity document image'} and extract ALL visible information.

CRITICAL INSTRUCTIONS:
- Extract EXACTLY what you see, do not invent or assume data.
- For dates, use DD/MM/YYYY format exactly as shown.
- Document numbers must be EXACT (including letters).
- If a field is not visible or unclear, use null.
- Return ONLY valid JSON, no markdown, no explanations.

REQUIRED FIELDS:
{
  "type": "DNI" | "NIE" | "PASSPORT",  // Identify document type based on visual cues.
  "documentNumber": "12345678A",  // EXACT ID number with letter.
  "name": "First name(s) only",
  "surname": "Surname(s) / Apellidos only",
  "fullName": "Complete name (Name + Surnames)",
  "birthDate": "DD/MM/YYYY",  // Fecha de nacimiento
  "expiryDate": "DD/MM/YYYY",  // Fecha de caducidad / Válido hasta
  "nationality": "ESP" | "Country Code",  // Nacionalidad (3 letter code if possible)
  "sex": "M" | "F"  // Sexo
}

IMPORTANT TIPS:
- DNI usually has "DOCUMENTO NACIONAL DE IDENTIDAD" header.
- NIE usually starts with X, Y, or Z.
- Passports are usually dark red/burgundy booklets.
- Ensure the document number is transcribed with high precision.

Return the JSON now:`;
                break;
        }

        if (extractedText) {
            prompt += `\n\nEXTRACTED TEXT:\n${extractedText}`;
        }

        console.log(`[LM Studio] Using local model for ${documentType}...`);

        const messages: Message[] = [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: prompt
                    }
                ]
            }
        ];

        // LM Studio vision models support image_url
        if (!extractedText) {
            const base64Image = imageBuffer.toString('base64');
            const dataUrl = `data:${mimeType};base64,${base64Image}`;
            messages[0].content.push({
                type: 'image_url',
                image_url: {
                    url: dataUrl
                }
            });
        }

        // LM Studio can optionally specify model (uses loaded model if not specified)
        const requestBody: {
            messages: Message[];
            temperature: number;
            max_tokens: number;
            stream: boolean;
            model?: string;
        } = {
            messages: messages,
            temperature: 0.1,
            max_tokens: 2000,
            stream: false
        };

        // Optionally specify model name (e.g., qwen/qwen3-vl-4b)
        const modelName = process.env.LMSTUDIO_MODEL;
        if (modelName) {
            requestBody.model = modelName;
            console.log(`[LM Studio] Using model: ${modelName}`);
        }

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LM Studio API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const typedData = data as LLMResponse;
        const content = typedData.choices?.[0]?.message?.content || '';

        const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
        let extractedData = null;

        try {
            extractedData = JSON.parse(jsonStr);
        } catch {
            console.warn(`[LM Studio] Failed to parse JSON`);
            throw new Error('Invalid JSON response');
        }

        return {
            success: true,
            text: content,
            data: extractedData
        };

    } catch (error: unknown) {
        console.error('[LM Studio] OCR Error:', error);
        const message = error instanceof Error ? error.message : 'LM Studio OCR analysis failed';
        return {
            success: false,
            text: '',
            error: message,
        };
    }
}

export function isLMStudioConfigured(): boolean {
    // LM Studio is always available if running locally
    // You can add a health check here if needed
    return true;
}
