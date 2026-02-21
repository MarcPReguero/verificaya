import { strict as assert } from 'node:assert';

import { CreditCheckResult } from '@/lib/services/asnef.service';
import { extractOcrContext } from '@/lib/ocr/extract-ocr-context';
import { ScreeningService } from '@/lib/services/screening.service';
import { TenantScreening } from '@/types';

const baseCreditResult: CreditCheckResult = {
  success: true,
  demoMode: true,
  documentNumber: '12345678A',
  fullName: 'Test User',
  creditScore: 820,
  riskLevel: 'low',
  hasActiveDebts: false,
  totalDebt: 0,
  debtRecords: [],
  isInAsnef: false,
  monthsInAsnef: 0,
  previousDebts: 0,
  analysis: {
    paymentBehavior: 'excellent',
    debtToIncomeEstimate: 0.12,
    recommendation: 'approve',
    warnings: [],
    positives: ['No observations'],
  },
  consultedAt: new Date().toISOString(),
  validUntil: new Date().toISOString(),
};

const lowCreditResult: CreditCheckResult = {
  ...baseCreditResult,
  creditScore: 0,
  riskLevel: 'very_high',
  hasActiveDebts: true,
  totalDebt: 3000,
  isInAsnef: true,
  monthsInAsnef: 1,
  analysis: {
    paymentBehavior: 'very_poor',
    debtToIncomeEstimate: 1,
    recommendation: 'reject',
    warnings: ['Bad credit profile'],
    positives: [],
  },
};

const withOcrMismatchContext = {
  identity: {
    type: 'DNI',
    documentNumber: '87654321Z',
    fullName: 'Lucia Fernandez',
  },
  payslip: {
    netIncome: '1.000,00',
    employerName: 'Empresa Diferente',
  },
  contract: {
    landlordName: 'Arrendador Otro',
    tenantName: 'Otro Inquilino',
    propertyAddress: 'Calle Equivocada 99',
    monthlyRent: '900',
  },
};

const withOcrMatchingContext = {
  identity: {
    type: 'DNI',
    documentNumber: '12345678A',
    fullName: 'Ana Ruiz',
  },
  payslip: {
    netIncome: '1.900,00',
    employerName: 'Empresa Acme',
  },
  contract: {
    landlordName: 'Propietario Cero',
    tenantName: 'Ana Ruiz',
    propertyAddress: 'Calle Buena 1',
    monthlyRent: '900 EUR',
  },
};

const baseScreening = (partial?: Partial<TenantScreening>): Partial<TenantScreening> => ({
  tenantName: 'Ana Ruiz',
  monthlyIncome: 1900,
  monthlyRent: 900,
  employmentStatus: 'employed',
  documentType: 'DNI',
  documentNumber: '12345678A',
  employmentYears: 2,
  contractType: 'indefinido',
  employerName: 'Empresa Acme',
  previousAddress: 'Calle Buena 1',
  previousLandlordName: 'Propietario Cero',
  ...partial,
});

const run = () => {
  let passed = 0;
  let failed = 0;

  const test = (name: string, fn: () => void) => {
    try {
      fn();
      passed++;
      console.log(`PASS: ${name}`);
    } catch (error) {
      failed++;
      console.error(`FAIL: ${name}`, error);
    }
  };

  test('normalizeScore never returns a negative value', () => {
    const result = ScreeningService.calculateScore({}, lowCreditResult, withOcrMismatchContext);
    assert.ok(result.score >= 0, `expected score >= 0, got ${result.score}`);
    assert.strictEqual(result.score, 0);
  });

  test('matching OCR payload keeps score near baseline', () => {
    const base = ScreeningService.calculateScore(baseScreening(), baseCreditResult, withOcrMatchingContext);
    const withoutOcr = ScreeningService.calculateScore(baseScreening(), baseCreditResult);
    assert.ok(base.score >= withoutOcr.score - 5, `OCR match should not heavily reduce score (base=${base.score}, noOCR=${withoutOcr.score})`);
  });

  test('mismatched OCR payload triggers risk flags and lowers score', () => {
    const base = ScreeningService.calculateScore(baseScreening(), baseCreditResult, withOcrMatchingContext);
    const mismatch = ScreeningService.calculateScore(baseScreening(), baseCreditResult, withOcrMismatchContext);
    assert.ok(mismatch.score < base.score, `expected penalty from mismatch (base=${base.score}, mismatch=${mismatch.score})`);
    assert.ok(mismatch.fraudFlags.some((flag) => flag.type === 'document_mismatch'), 'expected document_mismatch flag');
    assert.ok(mismatch.fraudFlags.length >= 1, 'expected at least one fraud flag');
  });

  test('extractOcrContext supports nested ocr JSON string', () => {
    const extracted = extractOcrContext({
      analysis: JSON.stringify({
        identity: { documentNumber: '123', fullName: 'Ana Ruiz' },
        payslip: { netIncome: '1000' },
      }),
    });

    assert.deepStrictEqual(Object.keys(extracted || {}), ['identity', 'payslip']);
    const identity = extracted?.identity as { fullName?: string } | undefined;
    assert.strictEqual(identity?.fullName, 'Ana Ruiz');
  });

  test('extractOcrContext supports alternate legacy keys', () => {
    const payload = extractOcrContext({ ocr_data: { contract: { monthlyRent: 700 } } });
    assert.deepStrictEqual(payload, { contract: { monthlyRent: 700 } });
  });

  test('extractOcrContext returns undefined for unknown payloads', () => {
    const missing = extractOcrContext({ some: 'value', other: 123 });
    assert.strictEqual(missing, undefined);
  });

  console.log(`\nVERIFY SUMMARY: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
};

run();
