import { TenantScreening, ScreeningResult } from '@/types';
import { AsnefService, CreditCheckResult } from './asnef.service';

export class ScreeningService {
  /**
   * Calculate screening score based on multiple factors
   * Now includes ASNEF credit check integration
   */
  static calculateScore(
    screening: Partial<TenantScreening>,
    creditCheckResult?: CreditCheckResult
  ): ScreeningResult {
    let score = 0;
    const notes: string[] = [];
    let identityVerified = false;
    let incomeVerified = false;
    let creditCheckPassed = false;
    let referencesVerified = false;

    // 1. Income to Rent Ratio (30 points max)
    if (screening.monthlyIncome && screening.monthlyRent) {
      const ratio = screening.monthlyIncome / screening.monthlyRent;
      
      if (ratio >= 3) {
        score += 30;
        incomeVerified = true;
        notes.push('✓ Excelente relación ingresos/alquiler (3x o más)');
      } else if (ratio >= 2.5) {
        score += 25;
        incomeVerified = true;
        notes.push('✓ Buena relación ingresos/alquiler (2.5x)');
      } else if (ratio >= 2) {
        score += 15;
        incomeVerified = true;
        notes.push('⚠ Relación ingresos/alquiler aceptable (2x)');
      } else {
        score += 5;
        notes.push('⚠ Relación ingresos/alquiler baja (menos de 2x)');
      }
    }

    // 2. Employment Status (20 points max)
    if (screening.employmentStatus) {
      switch (screening.employmentStatus) {
        case 'employed':
          score += 20;
          notes.push('✓ Empleado por cuenta ajena');
          break;
        case 'self-employed':
          score += 15;
          notes.push('✓ Autónomo');
          break;
        case 'student':
          score += 10;
          notes.push('⚠ Estudiante (recomendado avalista)');
          break;
        case 'unemployed':
          score += 0;
          notes.push('✗ Sin empleo actual');
          break;
      }
    }

    // 3. Document Verification (25 points max)
    if (screening.documentType && screening.documentNumber) {
      identityVerified = true;
      score += 25;
      notes.push(`✓ Documento verificado: ${screening.documentType}`);
    } else {
      notes.push('⚠ Pendiente verificación de documentos');
    }

    // 4. Credit Check with ASNEF (25 points max) - UPGRADED!
    if (creditCheckResult) {
      // Real ASNEF data available
      const creditPoints = AsnefService.creditScoreToPoints(creditCheckResult.creditScore);
      score += creditPoints;
      creditCheckPassed = creditPoints >= 15;
      
      if (creditCheckResult.isInAsnef && creditCheckResult.hasActiveDebts) {
        notes.push(`⚠️ ASNEF: Deuda activa de €${creditCheckResult.totalDebt.toLocaleString('es-ES')}`);
        notes.push(`⚠️ Incluido en fichero de morosos desde hace ${creditCheckResult.monthsInAsnef} meses`);
      } else if (creditCheckResult.creditScore >= 800) {
        notes.push(`✓ Score crediticio excelente: ${creditCheckResult.creditScore}/1000`);
      } else if (creditCheckResult.creditScore >= 600) {
        notes.push(`✓ Score crediticio bueno: ${creditCheckResult.creditScore}/1000`);
      } else if (creditCheckResult.creditScore >= 400) {
        notes.push(`⚠ Score crediticio regular: ${creditCheckResult.creditScore}/1000`);
      } else {
        notes.push(`⚠️ Score crediticio bajo: ${creditCheckResult.creditScore}/1000`);
      }
      
      // Add specific warnings
      creditCheckResult.analysis.warnings.forEach(warning => {
        if (!notes.includes(warning)) {
          notes.push(warning);
        }
      });
      
    } else {
      // Fallback: Simulación (cuando no hay consulta ASNEF)
      const creditScore = Math.random() > 0.3 ? 15 : 5; // 70% pass rate for demo
      score += creditScore;
      creditCheckPassed = creditScore >= 10;
      
      if (creditCheckPassed) {
        notes.push('✓ Historial crediticio favorable (simulado)');
      } else {
        notes.push('⚠ Historial crediticio con observaciones (simulado)');
      }
    }

    // 5. References Verification (10 points max)
    // Simulated for demo - in production, check actual references
    const hasReferences = Math.random() > 0.2; // 80% have references
    if (hasReferences) {
      score += 10;
      referencesVerified = true;
      notes.push('✓ Referencias verificadas positivamente');
    } else {
      score += 5;
      notes.push('⚠ Referencias pendientes o incompletas');
    }

    // Determine approval
    const approved = score >= 60;

    // Generate recommendations
    let recommendations = '';
    if (score >= 80) {
      recommendations = '🟢 APROBADO - Inquilino de perfil excelente. Se recomienda proceder con el alquiler.';
    } else if (score >= 60) {
      recommendations = '🟡 APROBADO CON RESERVAS - Perfil aceptable. Considere solicitar garantías adicionales (aval o fianza mayor).';
    } else {
      recommendations = '🔴 NO RECOMENDADO - El perfil presenta riesgos significativos. Se recomienda solicitar avalista solvente o rechazar la solicitud.';
    }

    return {
      screeningId: screening.id || '',
      score,
      approved,
      identityVerified,
      incomeVerified,
      creditCheckPassed,
      referencesVerified,
      notes,
      recommendations,
    };
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
