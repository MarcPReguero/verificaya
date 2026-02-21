import { TenantScreening, ScreeningResult, FraudFlag, ScoringFactor } from '@/types';
import { AsnefService, CreditCheckResult } from './asnef.service';

interface OcrCrossValidationContext {
  identity?: {
    type?: string;
    documentNumber?: string;
    fullName?: string;
    name?: string;
    surname?: string;
  };
  payslip?: {
    netIncome?: unknown;
    grossIncome?: unknown;
    employerName?: string;
    employeeName?: string;
  };
  contract?: {
    landlordName?: string;
    tenantName?: string;
    propertyAddress?: string;
    monthlyRent?: unknown;
    startDate?: string;
    duration?: string;
  };
}

interface OcrCrossValidationResult {
  scoreDelta: number;
  notes: string[];
  fraudFlags: FraudFlag[];
  negativeFactors: ScoringFactor[];
  identityVerified?: boolean;
}

export class ScreeningService {
  private static readonly MIN_LIVING_EXPENSES = 600; // Minimum monthly amount needed for living expenses (conservative)

  /**
   * Calculate screening score based on multiple factors
   * Now includes ASNEF credit check integration, employment stability,
   * fraud detection, and GDPR-compliant explanations
   */
  static calculateScore(
    screening: Partial<TenantScreening>,
    creditCheckResult?: CreditCheckResult,
    ocrContext?: OcrCrossValidationContext
  ): ScreeningResult {
    let score = 0;
    const notes: string[] = [];
    const fraudFlags: FraudFlag[] = [];
    const positiveFactors: ScoringFactor[] = [];
    const negativeFactors: ScoringFactor[] = [];

    let identityVerified = false;
    let incomeVerified = false;
    let creditCheckPassed = false;
    let referencesVerified = false;

    // 1. Income to Rent Ratio (25 points max - reduced from 30)
    if (screening.monthlyIncome && screening.monthlyRent) {
      const ratio = screening.monthlyIncome / screening.monthlyRent;

      // FRAUD DETECTION: Suspicious income-to-rent patterns
      if (ratio < 2) {
        fraudFlags.push({
          type: 'suspicious_ratio',
          severity: 'high',
          description: 'Alquiler supera el 50% de los ingresos - riesgo alto de impago'
        });
        score += 5;
        notes.push('⚠️ ALTO RIESGO: Alquiler >50% de ingresos (ratio <2x)');
        negativeFactors.push({
          factor: 'Relación ingresos/alquiler',
          points: -20,
          description: 'El alquiler representa más del 50% de los ingresos mensuales'
        });
      } else if (ratio >= 3) {
        score += 25;
        incomeVerified = true;
        notes.push('✓ Excelente relación ingresos/alquiler (3x o más)');
        positiveFactors.push({
          factor: 'Relación ingresos/alquiler',
          points: 25,
          description: 'Ingresos son 3x o más del alquiler mensual'
        });
      } else if (ratio >= 2.5) {
        score += 20;
        incomeVerified = true;
        notes.push('✓ Buena relación ingresos/alquiler (2.5x)');
        positiveFactors.push({
          factor: 'Relación ingresos/alquiler',
          points: 20,
          description: 'Ingresos son 2.5x del alquiler mensual'
        });
      } else if (ratio >= 2) {
        score += 12;
        incomeVerified = true;
        notes.push('⚠ Relación ingresos/alquiler aceptable (2x)');
        negativeFactors.push({
          factor: 'Relación ingresos/alquiler',
          points: -13,
          description: 'Ingresos justos (2x alquiler) - margen ajustado'
        });
      }

      // FRAUD DETECTION: Suspicious high income for low rent (money laundering risk)
      if (ratio > 10 && screening.monthlyRent < 1500) {
        fraudFlags.push({
          type: 'income_anomaly',
          severity: 'medium',
          description: 'Patrón inusual: Ingresos muy altos para alquiler modesto'
        });
        notes.push('⚠ Patrón inusual detectado - revisión manual recomendada');
      }

      // NEW: Disposable Income Check
      const disposableIncome = screening.monthlyIncome - screening.monthlyRent;
      if (disposableIncome < ScreeningService.MIN_LIVING_EXPENSES) {
        score -= 15;
        notes.push(`⚠️ RIESGO ALTO: Ingresos disponibles (€${disposableIncome}) inferiores al mínimo vital (€${ScreeningService.MIN_LIVING_EXPENSES})`);
        negativeFactors.push({
          factor: 'Capacidad de pago',
          points: -15,
          description: 'Ingresos insuficientes para cubrir gastos de vida básicos tras pagar el alquiler'
        });
      }

      // NEW: Debt-to-Income (DTI) Ratio
      // We estimate monthly debt payments as 3% of total debt if exact payments aren't known
      if (creditCheckResult && creditCheckResult.totalDebt > 0) {
        const estimatedDebtPayment = creditCheckResult.totalDebt * 0.03;
        const totalMonthlyObligations = screening.monthlyRent + estimatedDebtPayment;
        const dtiRatio = totalMonthlyObligations / screening.monthlyIncome;

        if (dtiRatio > 0.45) { // >45% is very high risk
          score -= 15;
          notes.push(`⚠️ SOBREENDEUDAMIENTO: Ratio DTI ${(dtiRatio * 100).toFixed(0)}% (Alquiler + Deudas > 45% ingresos)`);
          negativeFactors.push({
            factor: 'Endeudamiento',
            points: -15,
            description: 'Alto nivel de endeudamiento en relación a los ingresos'
          });
        } else if (dtiRatio > 0.35) { // >35% is warning
          score -= 5;
          notes.push(`⚠ Endeudamiento elevado: Ratio DTI ${(dtiRatio * 100).toFixed(0)}%`);
          negativeFactors.push({
            factor: 'Endeudamiento',
            points: -5,
            description: 'Nivel de endeudamiento considerable'
          });
        }
      }
    }

    // 2. Employment Status & Stability (25 points max - IMPROVED!)
    if (screening.employmentStatus) {
      let employmentPoints = 0;

      // Base employment status (0-12 points)
      switch (screening.employmentStatus) {
        case 'employed':
          employmentPoints += 12;
          notes.push('✓ Empleado por cuenta ajena');
          positiveFactors.push({
            factor: 'Situación laboral',
            points: 12,
            description: 'Empleado por cuenta ajena con ingresos regulares'
          });
          break;
        case 'self-employed':
          employmentPoints += 10;
          notes.push('✓ Autónomo');
          positiveFactors.push({
            factor: 'Situación laboral',
            points: 10,
            description: 'Trabajador autónomo'
          });
          break;
        case 'student':
          employmentPoints += 5;
          notes.push('⚠ Estudiante (se recomienda avalista)');
          negativeFactors.push({
            factor: 'Situación laboral',
            points: -7,
            description: 'Estudiante sin ingresos estables - requiere garantías adicionales'
          });
          break;
        case 'unemployed':
          employmentPoints += 0;
          notes.push('✗ Sin empleo actual');
          negativeFactors.push({
            factor: 'Situación laboral',
            points: -12,
            description: 'Sin empleo actual - alto riesgo de impago'
          });
          break;
      }

      // NEW: Employment stability bonus (0-8 points)
      if (screening.employmentYears !== undefined) {
        if (screening.employmentYears >= 3) {
          employmentPoints += 8;
          notes.push('✓ Alta estabilidad laboral (3+ años en puesto actual)');
          positiveFactors.push({
            factor: 'Estabilidad laboral',
            points: 8,
            description: '3 o más años en el empleo actual'
          });
        } else if (screening.employmentYears >= 1) {
          employmentPoints += 5;
          notes.push('✓ Estabilidad laboral moderada (1-3 años)');
          positiveFactors.push({
            factor: 'Estabilidad laboral',
            points: 5,
            description: '1-3 años en el empleo actual'
          });
        } else if (screening.employmentYears < 1) {
          employmentPoints += 2;
          notes.push('⚠ Estabilidad laboral baja (<1 año en puesto)');
          negativeFactors.push({
            factor: 'Estabilidad laboral',
            points: -6,
            description: 'Menos de 1 año en empleo actual'
          });
        }
      }

      // NEW: Contract type bonus (0-5 points) - Spanish labor law specific
      if (screening.contractType) {
        if (screening.contractType === 'indefinido') {
          employmentPoints += 5;
          notes.push('✓ Contrato indefinido');
          positiveFactors.push({
            factor: 'Tipo de contrato',
            points: 5,
            description: 'Contrato indefinido - máxima seguridad laboral'
          });
        } else if (screening.contractType === 'temporal') {
          employmentPoints += 2;
          notes.push('⚠ Contrato temporal');
          negativeFactors.push({
            factor: 'Tipo de contrato',
            points: -3,
            description: 'Contrato temporal - menor seguridad laboral'
          });
        } else if (screening.contractType === 'autonomo') {
          employmentPoints += 3;
          notes.push('⚠ Régimen de autónomo (ingresos variables)');
        }
      }

      score += Math.min(employmentPoints, 25); // Cap at 25 points

      // NEW: Consistency Checks (Fraud Detection)
      // Check 1: Unemployed but High Income
      if (screening.employmentStatus === 'unemployed' && screening.monthlyIncome && screening.monthlyIncome > 2000) {
        fraudFlags.push({
          type: 'data_inconsistency',
          severity: 'high',
          description: 'Inconsistencia: Desempleado con ingresos altos (>€2000)'
        });
        notes.push('⚠️ ALERTA: Desempleado declarando ingresos altos - Verificar fuente de ingresos');
      }

      // Check 2: Student with High Income and No Guarantor (Implicit check)
      if (screening.employmentStatus === 'student' && screening.monthlyIncome && screening.monthlyIncome > 1500) {
        notes.push('ℹ️ Estudiante con ingresos altos - Verificar si son becas o ayuda familiar');
      }
    }

    // 3. Document Verification (10 points max - reduced, it's hygiene not predictor)
    if (screening.documentType && screening.documentNumber) {
      // Basic validation
      const isValid = this.validateSpanishDocument(
        screening.documentType,
        screening.documentNumber
      );

      if (isValid) {
        identityVerified = true;
        score += 10;
        notes.push(`✓ Documento verificado: ${screening.documentType}`);
        positiveFactors.push({
          factor: 'Verificación de identidad',
          points: 10,
          description: `Documento ${screening.documentType} validado correctamente`
        });
      } else {
        score += 3;
        notes.push(`⚠ Formato de documento irregular: ${screening.documentType}`);
        fraudFlags.push({
          type: 'document_mismatch',
          severity: 'high',
          description: 'Formato de documento no válido o irregular'
        });
        negativeFactors.push({
          factor: 'Verificación de identidad',
          points: -7,
          description: 'Documento con formato irregular o no validado'
        });
      }

      const ocrValidation = this.applyOcrCrossValidation(screening, ocrContext);
      score += ocrValidation.scoreDelta;
      notes.push(...ocrValidation.notes);
      fraudFlags.push(...ocrValidation.fraudFlags);
      negativeFactors.push(...ocrValidation.negativeFactors);

      if (ocrValidation.identityVerified === false) {
        identityVerified = false;
      }
    } else {
      notes.push('⚠ Pendiente verificación de documentos');
      negativeFactors.push({
        factor: 'Verificación de identidad',
        points: -10,
        description: 'Sin documentos de identidad proporcionados'
      });
    }

    // 4. Credit Check with ASNEF (30 points max - INCREASED! Most predictive factor)
    if (creditCheckResult) {
      // Real ASNEF data available
      const creditPoints = AsnefService.creditScoreToPoints(creditCheckResult.creditScore);

      // NEW: Recency weighting - recent debts are worse than old ones
      let adjustedCreditPoints = creditPoints;

      if (creditCheckResult.isInAsnef && creditCheckResult.hasActiveDebts) {
        // Penalty based on how recent the ASNEF entry is
        if (creditCheckResult.monthsInAsnef <= 3) {
          adjustedCreditPoints -= 10; // Recent = very bad
          notes.push(`⚠️ ASNEF RECIENTE: Deuda activa de €${creditCheckResult.totalDebt.toLocaleString('es-ES')} desde hace ${creditCheckResult.monthsInAsnef} meses`);
          fraudFlags.push({
            type: 'data_inconsistency',
            severity: 'high',
            description: `Inclusión reciente en ASNEF (${creditCheckResult.monthsInAsnef} meses)`
          });
        } else if (creditCheckResult.monthsInAsnef <= 12) {
          adjustedCreditPoints -= 5;
          notes.push(`⚠️ ASNEF: Deuda activa de €${creditCheckResult.totalDebt.toLocaleString('es-ES')} desde hace ${creditCheckResult.monthsInAsnef} meses`);
        } else {
          adjustedCreditPoints -= 2; // Old debt = less concerning
          notes.push(`⚠ ASNEF antiguo: Deuda de €${creditCheckResult.totalDebt.toLocaleString('es-ES')} (${creditCheckResult.monthsInAsnef} meses)`);
        }

        negativeFactors.push({
          factor: 'Historial crediticio ASNEF',
          points: adjustedCreditPoints - creditPoints,
          description: `Deuda activa: €${creditCheckResult.totalDebt.toLocaleString('es-ES')} registrada hace ${creditCheckResult.monthsInAsnef} meses`
        });
      } else if (creditCheckResult.creditScore >= 800) {
        notes.push(`✓ Score crediticio excelente: ${creditCheckResult.creditScore}/1000`);
        positiveFactors.push({
          factor: 'Historial crediticio',
          points: creditPoints,
          description: 'Score crediticio excelente (800+/1000) sin deudas activas'
        });
      } else if (creditCheckResult.creditScore >= 600) {
        notes.push(`✓ Score crediticio bueno: ${creditCheckResult.creditScore}/1000`);
        positiveFactors.push({
          factor: 'Historial crediticio',
          points: creditPoints,
          description: 'Score crediticio bueno (600-800/1000)'
        });
      } else if (creditCheckResult.creditScore >= 400) {
        notes.push(`⚠ Score crediticio regular: ${creditCheckResult.creditScore}/1000`);
        negativeFactors.push({
          factor: 'Historial crediticio',
          points: creditPoints - 25,
          description: 'Score crediticio regular (400-600/1000)'
        });
      } else {
        notes.push(`⚠️ Score crediticio bajo: ${creditCheckResult.creditScore}/1000`);
        negativeFactors.push({
          factor: 'Historial crediticio',
          points: creditPoints - 25,
          description: 'Score crediticio bajo (<400/1000) - alto riesgo'
        });
      }

      // Add specific warnings
      creditCheckResult.analysis.warnings.forEach(warning => {
        if (!notes.includes(warning)) {
          notes.push(warning);
        }
      });

      score += Math.max(0, adjustedCreditPoints); // Ensure non-negative
      creditCheckPassed = adjustedCreditPoints >= 15;

    } else {
      // Fallback: Simulación (cuando no hay consulta ASNEF)
      const creditScore = Math.random() > 0.3 ? 15 : 5; // 70% pass rate for demo
      score += creditScore;
      creditCheckPassed = creditScore >= 10;

      if (creditCheckPassed) {
        notes.push('✓ Historial crediticio favorable (simulado)');
        positiveFactors.push({
          factor: 'Historial crediticio',
          points: creditScore,
          description: 'Sin información negativa detectada (modo demo)'
        });
      } else {
        notes.push('⚠ Historial crediticio con observaciones (simulado)');
        negativeFactors.push({
          factor: 'Historial crediticio',
          points: creditScore - 15,
          description: 'Historial con observaciones (modo demo)'
        });
      }
    }

    // 5. References Verification (10 points max) - FIXED! No more random
    if (screening.references && screening.references.length > 0) {
      const verifiedRefs = screening.references.filter(r => r.verified);

      if (verifiedRefs.length >= 2) {
        score += 10;
        referencesVerified = true;
        notes.push(`✓ Referencias verificadas (${verifiedRefs.length} verificadas)`);
        positiveFactors.push({
          factor: 'Referencias',
          points: 10,
          description: `${verifiedRefs.length} referencias verificadas positivamente`
        });
      } else if (verifiedRefs.length === 1) {
        score += 6;
        referencesVerified = true;
        notes.push('✓ 1 referencia verificada');
        positiveFactors.push({
          factor: 'Referencias',
          points: 6,
          description: '1 referencia verificada'
        });
      } else {
        score += 3;
        notes.push('⚠ Referencias proporcionadas pero pendientes de verificación');
        negativeFactors.push({
          factor: 'Referencias',
          points: -7,
          description: 'Referencias sin verificar'
        });
      }
    } else {
      score += 0;
      notes.push('⚠ Sin referencias proporcionadas');
      negativeFactors.push({
        factor: 'Referencias',
        points: -10,
        description: 'No se proporcionaron referencias'
      });
    }

    // Determine approval
    const normalizedScore = Math.max(0, score);

    const approved = normalizedScore >= 60;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'very_high';
    if (normalizedScore >= 80) {
      riskLevel = 'low';
    } else if (normalizedScore >= 70) {
      riskLevel = 'medium';
    } else if (normalizedScore >= 50) {
      riskLevel = 'high';
    } else {
      riskLevel = 'very_high';
    }

    // Adjust risk level if fraud flags exist
    if (fraudFlags.some(f => f.severity === 'high')) {
      if (riskLevel === 'low') riskLevel = 'medium';
      if (riskLevel === 'medium') riskLevel = 'high';
      if (riskLevel === 'high') riskLevel = 'very_high';
    }

    // Generate recommendations
    let recommendations = '';
    if (normalizedScore >= 80 && fraudFlags.length === 0) {
      recommendations = '🟢 APROBADO - Inquilino de perfil excelente. Se recomienda proceder con el alquiler.';
    } else if (normalizedScore >= 80 && fraudFlags.length > 0) {
      recommendations = '🟡 APROBADO CON RESERVAS - Buen perfil pero con observaciones. Revisar manualmente las alertas de fraude antes de proceder.';
    } else if (normalizedScore >= 60) {
      recommendations = '🟡 APROBADO CON RESERVAS - Perfil aceptable. Considere solicitar garantías adicionales (aval o fianza mayor).';
    } else if (normalizedScore >= 40) {
      recommendations = '🔴 NO RECOMENDADO - El perfil presenta riesgos significativos. Se recomienda solicitar avalista solvente o rechazar la solicitud.';
    } else {
      recommendations = '🔴 RECHAZADO - Perfil de alto riesgo. No se recomienda proceder con el alquiler.';
    }

    // NEW: Generate improvement suggestions (GDPR Article 22)
    const improvementSuggestions: string[] = [];
    if (normalizedScore < 80) {
      if (!incomeVerified || (screening.monthlyIncome && screening.monthlyRent && screening.monthlyIncome / screening.monthlyRent < 3)) {
        improvementSuggestions.push('Aumentar ingresos acreditables o buscar una propiedad con alquiler más bajo');
      }
      if (!creditCheckPassed) {
        improvementSuggestions.push('Resolver deudas pendientes en ASNEF para mejorar historial crediticio');
      }
      if (!referencesVerified) {
        improvementSuggestions.push('Proporcionar al menos 2 referencias verificables (empleador, anterior casero)');
      }
      if (screening.employmentYears !== undefined && screening.employmentYears < 1) {
        improvementSuggestions.push('Mayor antigüedad en el empleo actual mejoraría la estabilidad');
      }
      if (screening.contractType === 'temporal') {
        improvementSuggestions.push('Conseguir un contrato indefinido aumentaría significativamente la puntuación');
      }
      if (!identityVerified) {
        improvementSuggestions.push('Proporcionar documentación de identidad válida (DNI/NIE/Pasaporte)');
      }
    }

    // Sort factors by absolute value of points
    const topPositive = positiveFactors
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);

    const topNegative = negativeFactors
      .sort((a, b) => a.points - b.points)
      .slice(0, 3);

    return {
      screeningId: screening.id || '',
      score: normalizedScore,
      approved,
      identityVerified,
      incomeVerified,
      creditCheckPassed,
      referencesVerified,
      notes,
      recommendations,

      // NEW: Fraud detection
      fraudFlags,
      riskLevel,

      // NEW: GDPR-compliant explanations (Article 22 - Right to explanation)
      explanation: {
        topPositiveFactors: topPositive,
        topNegativeFactors: topNegative,
        improvementSuggestions,
      },

      // NEW: GDPR Article 22 - Right to human intervention
      humanReviewAvailable: true,

      // NEW: Data processing consent tracking
      dataProcessingConsent: {
        asnefCheckConsented: !!creditCheckResult,
        consentedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Compare OCR extracted fields with submitted form data and apply risk penalties.
   */
  private static applyOcrCrossValidation(
    screening: Partial<TenantScreening>,
    ocrContext?: OcrCrossValidationContext
  ): OcrCrossValidationResult {
    if (!ocrContext || typeof ocrContext !== 'object') {
      return { scoreDelta: 0, notes: [], fraudFlags: [], negativeFactors: [] };
    }

    const result: OcrCrossValidationResult = {
      scoreDelta: 0,
      notes: [],
      fraudFlags: [],
      negativeFactors: [],
    };

    // 1) Identity consistency checks
    if (ocrContext.identity) {
      const extractedDocumentNumber = this.normalizeDocumentNumber(ocrContext.identity.documentNumber);
      const declaredDocumentNumber = this.normalizeDocumentNumber(screening.documentNumber);
      if (extractedDocumentNumber && declaredDocumentNumber && extractedDocumentNumber !== declaredDocumentNumber) {
        result.scoreDelta -= 25;
        result.identityVerified = false;
        result.notes.push('⚠ OCR/Declarado: el nÃºmero de documento no coincide.');
        result.fraudFlags.push({
          type: 'document_mismatch',
          severity: 'high',
          description: 'NÃºmero de documento de OCR distinto al declarado'
        });
        result.negativeFactors.push({
          factor: 'ValidaciÃ³n por OCR',
          points: -25,
          description: 'Conflicto entre documento declarado e imagen analizada'
        });
      }

      const extractedFullName =
        this.getOcrTextValue(ocrContext.identity.fullName) ||
        this.getOcrTextValue(
          [ocrContext.identity.name, ocrContext.identity.surname]
            .filter(Boolean)
            .join(' ')
        );

      if (extractedFullName && screening.tenantName &&
          !this.textsMatch(extractedFullName, screening.tenantName, 0.7)) {
        result.scoreDelta -= 12;
        result.notes.push('⚠ OCR/Declarado: el nombre del titular no coincide.');
        result.fraudFlags.push({
          type: 'data_inconsistency',
          severity: 'medium',
          description: 'El nombre detectado por OCR de identidad no coincide con el declarado'
        });
        result.negativeFactors.push({
          factor: 'Coherencia de identidad',
          points: -12,
          description: 'Nombre del titular distinto al documento OCR'
        });
      }
    }

    // 2) Payslip consistency checks
    if (ocrContext.payslip) {
      const declaredIncome = screening.monthlyIncome;
      const ocrNetIncome = this.toNumeric(ocrContext.payslip.netIncome);

      if (declaredIncome && ocrNetIncome) {
        const incomePenalty = this.getMonetaryMismatchPenalty(declaredIncome, ocrNetIncome);
        if (incomePenalty < 0) {
          const diffPercent = ((Math.abs(declaredIncome - ocrNetIncome) / Math.max(declaredIncome, ocrNetIncome)) * 100);
          result.scoreDelta += incomePenalty;
          result.notes.push(`⚠ OCR/Declarado: la nÃ³mina neta (${ocrNetIncome} EUR) no coincide con el ingreso (${declaredIncome} EUR).`);
          result.fraudFlags.push({
            type: 'income_anomaly',
            severity: diffPercent > 35 ? 'high' : 'medium',
            description: `Diferencia de ${Math.round(diffPercent)}% entre renta declarada y nÃ³mina OCR`
          });
          result.negativeFactors.push({
            factor: 'Consistencia salarial',
            points: incomePenalty,
            description: 'Ingreso declarado distinto a nÃ³mina analizada por OCR'
          });
        }
      }

      const extractedEmployer = this.getOcrTextValue(ocrContext.payslip.employerName);
      if (extractedEmployer && screening.employerName &&
          !this.textsMatch(extractedEmployer, screening.employerName, 0.6)) {
        result.scoreDelta -= 8;
        result.notes.push('⚠ OCR/Declarado: el empleador de nÃ³mina no coincide con el declarado.');
        result.fraudFlags.push({
          type: 'data_inconsistency',
          severity: 'medium',
          description: 'Empleador de nÃ³mina extraÃ­do por OCR distinto al declarado'
        });
        result.negativeFactors.push({
          factor: 'Consistencia de empleador',
          points: -8,
          description: 'Empleador de nÃ³mina distinto al empleador declarado'
        });
      }
    }

    // 3) Contract consistency checks
    if (ocrContext.contract) {
      const extractedAddress = this.getOcrTextValue(ocrContext.contract.propertyAddress);
      const declaredPreviousAddress = this.getOcrTextValue(screening.previousAddress);
      if (extractedAddress && declaredPreviousAddress &&
          !this.textsMatch(extractedAddress, declaredPreviousAddress, 0.5)) {
        result.scoreDelta -= 10;
        result.notes.push('⚠ OCR/Declarado: la direcciÃ³n del contrato no coincide con el historial declarado.');
        result.fraudFlags.push({
          type: 'data_inconsistency',
          severity: 'low',
          description: 'DirecciÃ³n del contrato en OCR distinta a la registrada como anterior'
        });
        result.negativeFactors.push({
          factor: 'Consistencia de historial',
          points: -10,
          description: 'DirecciÃ³n del contrato y del historial no coinciden'
        });
      }

      const extractedLandlord = this.getOcrTextValue(ocrContext.contract.landlordName);
      const declaredPreviousLandlord = this.getOcrTextValue(screening.previousLandlordName);
      if (extractedLandlord && declaredPreviousLandlord &&
          !this.textsMatch(extractedLandlord, declaredPreviousLandlord, 0.6)) {
        result.scoreDelta -= 8;
        result.notes.push('⚠ OCR/Declarado: el arrendador del contrato no coincide con el historial declarado.');
        result.fraudFlags.push({
          type: 'data_inconsistency',
          severity: 'low',
          description: 'Arrendador de contrato OCR distinto al declarado'
        });
        result.negativeFactors.push({
          factor: 'Consistencia de arrendador',
          points: -8,
          description: 'Arrendador anterior inconsistente con datos extraÃ­dos por OCR'
        });
      }

      const extractedTenant = this.getOcrTextValue(ocrContext.contract.tenantName);
      if (extractedTenant && screening.tenantName &&
          !this.textsMatch(extractedTenant, screening.tenantName, 0.7)) {
        result.scoreDelta -= 8;
        result.notes.push('⚠ OCR/Declarado: el inquilino del contrato no coincide con el declarado.');
        result.fraudFlags.push({
          type: 'data_inconsistency',
          severity: 'medium',
          description: 'Arrendatario de contrato OCR distinto al inquilino declarado'
        });
        result.negativeFactors.push({
          factor: 'Consistencia del arrendatario',
          points: -8,
          description: 'Nombre de arrendatario en contrato incoherente con lo declarado'
        });
      }

      const declaredRent = screening.monthlyRent;
      const ocrContractRent = this.toNumeric(ocrContext.contract.monthlyRent);
      const comparableContractAddress = [
        declaredPreviousAddress,
        this.getOcrTextValue(screening.propertyAddress)
      ].filter((value): value is string => !!value);

      const hasComparableAddress = extractedAddress && comparableContractAddress.length > 0
        ? comparableContractAddress.some((address) => this.textsMatch(extractedAddress, address, 0.5))
        : false;

      if (declaredRent && ocrContractRent && hasComparableAddress) {
        const contractRentPenalty = this.getMonetaryMismatchPenalty(declaredRent, ocrContractRent, 0.45, 400);
        if (contractRentPenalty < 0) {
          const diffPercent = ((Math.abs(declaredRent - ocrContractRent) / Math.max(declaredRent, ocrContractRent)) * 100);
          result.scoreDelta += contractRentPenalty;
          result.notes.push(`⚠ OCR/Declarado: la renta del contrato (${ocrContractRent} EUR) no coincide con la renta declarada (${declaredRent} EUR).`);
          result.fraudFlags.push({
            type: 'data_inconsistency',
            severity: diffPercent > 60 ? 'high' : 'medium',
            description: 'Renta de contrato OCR distinta a la renta declarada'
          });
          result.negativeFactors.push({
            factor: 'Consistencia de renta',
            points: contractRentPenalty,
            description: 'Renta de contrato e importe declarado difieren significativamente'
          });
        }
      }
    }

    return result;
  }

  private static normalizeDocumentNumber(value?: string): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    return value.replace(/\s+/g, '').toUpperCase();
  }

  private static getOcrTextValue(value?: unknown): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const cleaned = value.trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  private static toNumeric(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value !== 'string') {
      return null;
    }

    const cleanedText = value
      .replace(/[^0-9.,-]/g, '')
      .replace(/\s/g, '');
    if (!cleanedText) {
      return null;
    }

    if (cleanedText.includes(',') && cleanedText.includes('.')) {
      const lastDot = cleanedText.lastIndexOf('.');
      const lastComma = cleanedText.lastIndexOf(',');
      const normalized = lastDot > lastComma
        ? cleanedText.replace(/,/g, '')
        : cleanedText.replace(/\./g, '').replace(/,/g, '.');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    const normalized = cleanedText.includes(',')
      ? cleanedText.replace(/,/g, '.')
      : cleanedText;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private static getMonetaryMismatchPenalty(declared: number, extracted: number, relativeThreshold = 0.35, absoluteThreshold = 1000): number {
    const diff = Math.abs(declared - extracted);
    if (diff === 0) {
      return 0;
    }

    const diffRatio = diff / Math.max(Math.abs(declared), Math.abs(extracted), 1);
    if (diffRatio >= relativeThreshold || diff >= absoluteThreshold) {
      return -20;
    }
    if (diffRatio >= 0.2 || diff >= absoluteThreshold * 0.35) {
      return -12;
    }
    if (diffRatio >= 0.1 || diff >= absoluteThreshold * 0.2) {
      return -6;
    }

    return 0;
  }

  private static toComparableText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static textsMatch(aRaw: string, bRaw: string, matchRatio = 0.6): boolean {
    const a = this.toComparableText(aRaw);
    const b = this.toComparableText(bRaw);
    if (!a || !b) {
      return false;
    }
    if (a === b) {
      return true;
    }

    if (a.includes(b) || b.includes(a)) {
      return true;
    }

    const aTokens = a.split(' ').filter((token) => token.length >= 2);
    const bTokens = b.split(' ').filter((token) => token.length >= 2);
    if (!aTokens.length || !bTokens.length) {
      return false;
    }

    const bSet = new Set(bTokens);
    const sharedCount = aTokens.filter((token) => bSet.has(token)).length;
    const requiredMatches = Math.max(
      1,
      Math.ceil(Math.min(aTokens.length, bTokens.length) * matchRatio)
    );

    return sharedCount >= requiredMatches;
  }

  /**
   * Validate Spanish NIE/DNI format
   */
  static validateSpanishDocument(documentType: string, documentNumber: string): boolean {
    if (documentType === 'NIE' || documentType === 'DNI') {
      // Basic validation: 8 digits + 1 letter
      const regex = /^[0-9XYZ][0-9]{7}[A-Z]$/i;
      return regex.test(documentNumber.toUpperCase());
    }
    // For passports, just check it's not empty
    return documentNumber.length >= 6;
  }

  /**
   * Calculate recommended rent based on income
   */
  static calculateRecommendedRent(monthlyIncome: number): number {
    // Standard: 30% of net income
    return Math.floor(monthlyIncome * 0.3);
  }
}
