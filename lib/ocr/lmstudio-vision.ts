
/**
 * LM Studio Local Vision API Client
 * Uses local LLMs via LM Studio for OCR
 */

export interface OCRResult {
    success: boolean;
    text: string;
    data?: any;
    error?: string;
}

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
- Extract EXACTLY what you see, do not invent or assume data
- For monetary amounts, extract ONLY the number (no € symbol, no text)
- For dates, use DD/MM/YYYY format
- If a field is not visible or unclear, use null
- Return ONLY valid JSON, no markdown, no explanations

REQUIRED FIELDS:
{
  "type": "PAYSLIP",
  "employerName": "Company name as shown on document",
  "employeeName": "Full employee name",
  "netIncome": 1234.56,  // LÍQUIDO A PERCIBIR - net amount to receive (number only)
  "grossIncome": 2000.00,  // TOTAL DEVENGADO - gross total earned (number only)
  "period": "Month YYYY",  // e.g., "Enero 2024" or "01/2024"
  "seniorityDate": "DD/MM/YYYY"  // ANTIGÜEDAD - employee start date, or null
}

IMPORTANT: 
- Look for "LÍQUIDO A PERCIBIR" or "LÍQUIDO TOTAL" for netIncome
- Look for "TOTAL DEVENGADO" or "TOTAL BRUTO" for grossIncome
- Look for "ANTIGÜEDAD" or "FECHA DE ALTA" for seniorityDate
- Extract numbers without currency symbols or formatting

Return the JSON now:`;
                break;

            case 'CONTRACT':
                prompt = `You are an expert OCR system specialized in Spanish Rental Contracts (Contratos de Arrendamiento).

${extractedText ? 'Analyze the following text extracted from a PDF contract' : 'Carefully examine this contract image'} and extract ALL visible information.

CRITICAL INSTRUCTIONS:
- Extract EXACTLY what you see, do not invent or assume data
- For monetary amounts, extract ONLY the number (no € symbol)
- For dates, use DD/MM/YYYY format
- If a field is not visible or unclear, use null
- Return ONLY valid JSON, no markdown, no explanations

REQUIRED FIELDS:
{
  "type": "CONTRACT",
  "landlordName": "Arrendador full name",
  "tenantName": "Arrendatario full name",
  "propertyAddress": "Complete address of the rented property",
  "monthlyRent": 850.00,  // Monthly rent amount (number only, no € symbol)
  "startDate": "DD/MM/YYYY",  // Contract start date
  "duration": "Duration text"  // e.g., "1 año", "indefinido", etc.
}

IMPORTANT:
- Look for "ARRENDADOR" or "PROPIETARIO" for landlord name
- Look for "ARRENDATARIO" or "INQUILINO" for tenant name
- Look for "RENTA MENSUAL", "PRECIO", or "CANTIDAD" for monthly rent
- Look for "FECHA DE INICIO", "COMIENZO", or "VIGENCIA" for start date
- Look for "DURACIÓN", "PLAZO", or "TIEMPO" for duration

Return the JSON now:`;
                break;

            case 'IDENTITY':
            default:
                prompt = `You are an expert OCR system specialized in Spanish identity documents (DNI, NIE, Passport).

${extractedText ? 'Analyze the following text extracted from a PDF identity document' : 'Carefully examine this identity document image'} and extract ALL visible information.

CRITICAL INSTRUCTIONS:
- Extract EXACTLY what you see, do not invent or assume data
- For dates, use DD/MM/YYYY format exactly as shown
- Document numbers must be EXACT (including letters)
- If a field is not visible or unclear, use null
- Return ONLY valid JSON, no markdown, no explanations

REQUIRED FIELDS:
{
  "type": "DNI" | "NIE" | "Pasaporte",  // Identify document type
  "documentNumber": "12345678A",  // EXACT ID number with letter
  "name": "First name(s)",
  "surname": "Surname(s) / Apellidos",
  "fullName": "Complete name",
  "birthDate": "DD/MM/YYYY",  // Fecha de nacimiento
  "expiryDate": "DD/MM/YYYY",  // Fecha de caducidad / Válido hasta
  "nationality": "ESP" | "Country",  // Nacionalidad
  "sex": "M" | "F"  // Sexo
}

IMPORTANT:
- DNI format: 8 digits + 1 letter (e.g., 12345678A)
- NIE format: Letter + 7 digits + letter (e.g., X1234567B)
- Look for "APELLIDOS" for surnames
- Look for "NOMBRE" for first names
- Look for "NACIMIENTO" or "NAC" for birth date
- Look for "CADUCIDAD", "VÁLIDO HASTA", or "EXPIRY" for expiry date
- Look for "NACIONALIDAD" or "NAT" for nationality
- Look for "SEXO" or "SEX" for gender

Return the JSON now:`;
                break;
        }

        if (extractedText) {
            prompt += `\n\nEXTRACTED TEXT:\n${extractedText}`;
        }

        console.log(`[LM Studio] Using local model for ${documentType}...`);

        const messages: any[] = [
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
        const requestBody: any = {
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
        const content = data.choices[0]?.message?.content || '';

        let jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
        let extractedData = null;

        try {
            extractedData = JSON.parse(jsonStr);
        } catch (e) {
            console.warn(`[LM Studio] Failed to parse JSON`);
            throw new Error('Invalid JSON response');
        }

        return {
            success: true,
            text: content,
            data: extractedData
        };

    } catch (error: any) {
        console.error('[LM Studio] OCR Error:', error);
        return {
            success: false,
            text: '',
            error: error.message || 'LM Studio OCR analysis failed'
        };
    }
}

export function isLMStudioConfigured(): boolean {
    // LM Studio is always available if running locally
    // You can add a health check here if needed
    return true;
}
