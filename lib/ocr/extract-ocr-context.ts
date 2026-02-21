export type OcrContextCandidate = Record<string, unknown> | null | undefined;

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
};

export const parsePotentialJson = (value: unknown): OcrContextCandidate => {
  if (typeof value !== 'string') {
    return isPlainObject(value) ? value : undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

export const isLikelyOcrContext = (value: unknown): value is Record<string, unknown> => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    'identity' in value ||
    'payslip' in value ||
    'contract' in value
  );
};

export const extractOcrContext = (explanation: unknown): Record<string, unknown> | undefined => {
  if (!isPlainObject(explanation)) {
    return undefined;
  }

  const candidates = [
    'ocrContext',
    'ocr',
    'ocr_data',
    'analysis',
    'data',
    'result',
    'payload',
    'explanation',
  ];

  for (const key of candidates) {
    const rawValue = (explanation as Record<string, unknown>)[key];
    if (!rawValue) {
      continue;
    }

    const parsed = parsePotentialJson(rawValue);
    if (isLikelyOcrContext(parsed)) {
      return parsed;
    }

    if (isLikelyOcrContext(rawValue)) {
      return rawValue;
    }
  }

  if (isLikelyOcrContext(explanation)) {
    return explanation;
  }

  return undefined;
};
