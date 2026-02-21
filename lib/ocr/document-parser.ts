/**
 * Document Parser for Spanish Identity Documents
 * Extracts structured data from DNI, NIE, and Passport
 */

import { OCRResult } from './google-vision';

/**
 * Parsed document data
 */
export interface ParsedDocument {
  type: 'DNI' | 'NIE' | 'PASSPORT' | 'Unknown';
  documentNumber: string;
  name?: string;
  surname?: string;
  fullName?: string;
  birthDate?: string;
  expiryDate?: string;
  nationality?: string;
  sex?: string;
  confidence: number;
  rawText: string;
}

/**
 * Parse Spanish DNI (Documento Nacional de Identidad)
 */
function parseDNI(text: string): Partial<ParsedDocument> {
  const result: Partial<ParsedDocument> = {
    type: 'DNI',
  };

  // Extract DNI number (8 digits + 1 letter)
  const dniRegex = /\b(\d{8})\s*([A-Z])\b/i;
  const dniMatch = text.match(dniRegex);
  if (dniMatch) {
    result.documentNumber = `${dniMatch[1]}${dniMatch[2].toUpperCase()}`;
  }

  // Extract name (after "Nombre" or similar)
  const nameRegex = /(?:Nombre|Name)[:\s]+([\p{L}\s]+)/iu;
  const nameMatch = text.match(nameRegex);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // Extract surname (after "Apellidos" or similar)
  const surnameRegex = /(?:Apellidos?|Surname)[:\s]+([\p{L}\s]+)/iu;
  const surnameMatch = text.match(surnameRegex);
  if (surnameMatch) {
    result.surname = surnameMatch[1].trim();
  }

  // Extract birth date (DD/MM/YYYY or DD.MM.YYYY)
  const birthRegex = /(?:Nacimiento|Birth)[:\s]*(\d{2})[./](\d{2})[./](\d{4})/i;
  const birthMatch = text.match(birthRegex);
  if (birthMatch) {
    result.birthDate = `${birthMatch[1]}/${birthMatch[2]}/${birthMatch[3]}`;
  }

  // Extract expiry date
  const expiryRegex = /(?:Validez|Valid|Caducidad)[:\s]*(\d{2})[./](\d{2})[./](\d{4})/i;
  const expiryMatch = text.match(expiryRegex);
  if (expiryMatch) {
    result.expiryDate = `${expiryMatch[1]}/${expiryMatch[2]}/${expiryMatch[3]}`;
  }

  // Extract sex
  const sexRegex = /(?:Sexo|Sex)[:\s]*([MFmf])/i;
  const sexMatch = text.match(sexRegex);
  if (sexMatch) {
    result.sex = sexMatch[1].toUpperCase();
  }

  // Nationality (always ESP for DNI)
  result.nationality = 'ESP';

  return result;
}

/**
 * Parse Spanish NIE (Numero de Identidad de Extranjero)
 */
function parseNIE(text: string): Partial<ParsedDocument> {
  const result: Partial<ParsedDocument> = {
    type: 'NIE',
  };

  // Extract NIE number (X/Y/Z + 7 digits + 1 letter)
  const nieRegex = /\b([XYZ])[\s-]?(\d{7})\s*([A-Z])\b/i;
  const nieMatch = text.match(nieRegex);
  if (nieMatch) {
    result.documentNumber = `${nieMatch[1].toUpperCase()}${nieMatch[2]}${nieMatch[3].toUpperCase()}`;
  }

  // Extract name
  const nameRegex = /(?:Nombre|Name)[:\s]+([\p{L}\s]+)/iu;
  const nameMatch = text.match(nameRegex);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // Extract surname
  const surnameRegex = /(?:Apellidos?|Surname)[:\s]+([\p{L}\s]+)/iu;
  const surnameMatch = text.match(surnameRegex);
  if (surnameMatch) {
    result.surname = surnameMatch[1].trim();
  }

  // Extract birth date
  const birthRegex = /(?:Nacimiento|Birth)[:\s]*(\d{2})[./](\d{2})[./](\d{4})/i;
  const birthMatch = text.match(birthRegex);
  if (birthMatch) {
    result.birthDate = `${birthMatch[1]}/${birthMatch[2]}/${birthMatch[3]}`;
  }

  // Extract expiry date
  const expiryRegex = /(?:Validez|Valid|Caducidad)[:\s]*(\d{2})[./](\d{2})[./](\d{4})/i;
  const expiryMatch = text.match(expiryRegex);
  if (expiryMatch) {
    result.expiryDate = `${expiryMatch[1]}/${expiryMatch[2]}/${expiryMatch[3]}`;
  }

  // Extract sex
  const sexRegex = /(?:Sexo|Sex)[:\s]*([MFmf])/i;
  const sexMatch = text.match(sexRegex);
  if (sexMatch) {
    result.sex = sexMatch[1].toUpperCase();
  }

  // Extract nationality
  const nationalityRegex = /(?:Nacionalidad|Nationality)[:\s]*([A-Z]{3})/i;
  const nationalityMatch = text.match(nationalityRegex);
  if (nationalityMatch) {
    result.nationality = nationalityMatch[1].toUpperCase();
  }

  return result;
}

/**
 * Parse Passport
 */
function parsePassport(text: string): Partial<ParsedDocument> {
  const result: Partial<ParsedDocument> = {
    type: 'PASSPORT',
  };

  // Extract passport number (various formats)
  const passportRegex = /\b([A-Z]{2,3}\d{6,9})\b/;
  const passportMatch = text.match(passportRegex);
  if (passportMatch) {
    result.documentNumber = passportMatch[1];
  }

  // Extract name and surname from MRZ (Machine Readable Zone)
  // Format: P<ESPGARCIA<<RODRIGUEZ<<JUAN<<<<<<<<<<<<<
  const mrzNameRegex = /P<[A-Z]{3}([A-Z<]+)/;
  const mrzMatch = text.match(mrzNameRegex);
  if (mrzMatch) {
    const nameParts = mrzMatch[1].split('<<').filter(Boolean);
    if (nameParts.length >= 2) {
      result.surname = nameParts[0].replace(/</g, ' ').trim();
      result.name = nameParts[1].replace(/</g, ' ').trim();
    }
  }

  // Extract birth date from MRZ or text
  const birthRegex = /(?:Date of birth|Fecha de nacimiento)[:\s]*(\d{2})[./](\d{2})[./](\d{4})/i;
  const birthMatch = text.match(birthRegex);
  if (birthMatch) {
    result.birthDate = `${birthMatch[1]}/${birthMatch[2]}/${birthMatch[3]}`;
  }

  // Extract expiry date
  const expiryRegex = /(?:Date of expiry|Fecha de caducidad)[:\s]*(\d{2})[./](\d{2})[./](\d{4})/i;
  const expiryMatch = text.match(expiryRegex);
  if (expiryMatch) {
    result.expiryDate = `${expiryMatch[1]}/${expiryMatch[2]}/${expiryMatch[3]}`;
  }

  // Extract sex
  const sexRegex = /(?:Sex|Sexo)[:\s]*([MFmf])/i;
  const sexMatch = text.match(sexRegex);
  if (sexMatch) {
    result.sex = sexMatch[1].toUpperCase();
  }

  // Extract nationality
  const nationalityRegex = /(?:Nationality|Nacionalidad)[:\s]*([A-Z]{3})/i;
  const nationalityMatch = text.match(nationalityRegex);
  if (nationalityMatch) {
    result.nationality = nationalityMatch[1].toUpperCase();
  }

  return result;
}

/**
 * Detect document type from text
 */
function detectDocumentType(text: string): 'DNI' | 'NIE' | 'PASSPORT' | 'Unknown' {
  const upperText = text.toUpperCase();

  // Check for DNI pattern
  if (/\b\d{8}\s*[A-Z]\b/.test(text) || 
      upperText.includes('DOCUMENTO NACIONAL') || 
      upperText.includes('DNI')) {
    return 'DNI';
  }

  // Check for NIE pattern
  if (/\b[XYZ][\s-]?\d{7}\s*[A-Z]\b/i.test(text) || 
      upperText.includes('NIE') ||
      upperText.includes('IDENTIDAD DE EXTRANJERO')) {
    return 'NIE';
  }

  // Check for Passport pattern
  if (/\b[A-Z]{2,3}\d{6,9}\b/.test(text) || 
      upperText.includes('PASSPORT') || 
      upperText.includes('PASAPORTE') ||
      upperText.includes('P<ESP')) {
      return 'PASSPORT';
  }

  return 'Unknown';
}

/**
 * Parse document from OCR result
 */
export function parseDocument(ocrResult: OCRResult): ParsedDocument {
  const { text, confidence } = ocrResult;

  // Detect document type
  const type = detectDocumentType(text);

  // Parse based on type
  let parsed: Partial<ParsedDocument> = { type };

  switch (type) {
    case 'DNI':
      parsed = { ...parsed, ...parseDNI(text) };
      break;
    case 'NIE':
      parsed = { ...parsed, ...parseNIE(text) };
      break;
    case 'PASSPORT':
      parsed = { ...parsed, ...parsePassport(text) };
      break;
    default: {
      // Try all parsers
      const dniData = parseDNI(text);
      const nieData = parseNIE(text);
      const passportData = parsePassport(text);
      
      // Use the one with most data
      if (dniData.documentNumber) parsed = { ...parsed, ...dniData, type: 'DNI' };
      else if (nieData.documentNumber) parsed = { ...parsed, ...nieData, type: 'NIE' };
      else if (passportData.documentNumber) parsed = { ...parsed, ...passportData, type: 'PASSPORT' };
    }
  }

  // Combine name and surname if both present
  if (parsed.name && parsed.surname) {
    parsed.fullName = `${parsed.name} ${parsed.surname}`;
  }

  return {
    type: parsed.type || 'Unknown',
    documentNumber: parsed.documentNumber || '',
    name: parsed.name,
    surname: parsed.surname,
    fullName: parsed.fullName,
    birthDate: parsed.birthDate,
    expiryDate: parsed.expiryDate,
    nationality: parsed.nationality,
    sex: parsed.sex,
    confidence,
    rawText: text,
  };
}

/**
 * Validate parsed document data
 */
export function validateDocument(parsed: ParsedDocument): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check document number
  if (!parsed.documentNumber) {
    errors.push('No se pudo extraer el numero de documento');
  } else {
    // Validate DNI format
    if (parsed.type === 'DNI') {
      if (!/^\d{8}[A-Z]$/.test(parsed.documentNumber)) {
        errors.push('Formato de DNI invalido');
      } else {
        // Validate DNI check letter
        const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
        const number = parseInt(parsed.documentNumber.substring(0, 8), 10);
        const expectedLetter = letters[number % 23];
        const actualLetter = parsed.documentNumber.charAt(8);
        if (expectedLetter !== actualLetter) {
          errors.push('Letra de control del DNI incorrecta');
        }
      }
    }

    // Validate NIE format
    if (parsed.type === 'NIE') {
      if (!/^[XYZ]\d{7}[A-Z]$/.test(parsed.documentNumber)) {
        errors.push('Formato de NIE invalido');
      }
    }
  }

  // Check expiry date
  if (parsed.expiryDate) {
    const [day, month, year] = parsed.expiryDate.split('/').map(Number);
    const expiryDate = new Date(year, month - 1, day);
    const today = new Date();
    
    if (expiryDate < today) {
      errors.push('El documento ha caducado');
    } else {
      // Warn if expiring soon (within 3 months)
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      if (expiryDate < threeMonthsFromNow) {
        warnings.push('El documento caduca pronto (menos de 3 meses)');
      }
    }
  }

  // Check confidence
  if (parsed.confidence < 0.7) {
    warnings.push('Baja calidad de imagen o documento poco legible');
  }

  // Check for missing critical data
  if (!parsed.name && !parsed.fullName) {
    warnings.push('No se pudo extraer el nombre completo');
  }

  if (!parsed.birthDate) {
    warnings.push('No se pudo extraer la fecha de nacimiento');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
