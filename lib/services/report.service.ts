import jsPDF from 'jspdf';
import { TenantScreening, ScreeningResult } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export class ReportService {
  static async generatePDFReport(
    screening: TenantScreening,
    result: ScreeningResult,
    isDemo: boolean = false
  ): Promise<Blob> {
    const doc = new jsPDF();
    
    // Demo Watermark (if applicable)
    if (isDemo) {
      doc.setFontSize(60);
      doc.setTextColor(220, 220, 220);
      doc.text('DEMO', 105, 150, { 
        align: 'center',
        angle: 45
      });
      doc.setTextColor(0, 0, 0);
    }
    
    // Header
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('VerificaYa', 20, 25);
    
    doc.setFontSize(12);
    doc.text(isDemo ? 'Informe DEMO - No Válido para Uso Legal' : 'Informe de Verificación de Inquilino', 20, 33);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Demo banner at top
    if (isDemo) {
      doc.setFillColor(34, 197, 94); // Green
      doc.rect(10, 45, 190, 8, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('🎯 INFORME DEMO - Este informe es de prueba y NO es válido para uso legal', 105, 50, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }
    
    // Date and ID
    doc.setFontSize(10);
    doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`, 150, isDemo ? 62 : 50);
    doc.text(`ID: ${screening.id.substring(0, 8)}${isDemo ? '-DEMO' : ''}`, 150, isDemo ? 68 : 56);
    
    // Score Box
    let yPos = isDemo ? 80 : 70;
    doc.setFontSize(16);
    doc.text('Puntuación General', 20, yPos);

    // Score circle
    const scoreColor = result.score >= 80 ? [34, 197, 94] as [number, number, number] : result.score >= 60 ? [234, 179, 8] as [number, number, number] : [239, 68, 68] as [number, number, number];
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(170, yPos + 5, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(`${result.score}`, 163, yPos + 9);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    // Risk Level Badge
    yPos += 25;
    doc.setFontSize(12);
    doc.text('Nivel de Riesgo:', 20, yPos);

    const riskLevelText = this.translateRiskLevel(result.riskLevel);
    const riskColor = this.getRiskLevelColor(result.riskLevel);
    doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.roundedRect(65, yPos - 5, 45, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(riskLevelText, 87.5, yPos + 1, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    
    // Tenant Information
    yPos += 30;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del Inquilino', 20, yPos);
    doc.setFont('helvetica', 'normal');
    
    yPos += 10;
    doc.setFontSize(10);
    const tenantInfo = [
      `Nombre: ${screening.tenantName}`,
      `Email: ${screening.tenantEmail}`,
      `Teléfono: ${screening.tenantPhone}`,
      `Documento: ${screening.documentType} ${screening.documentNumber}`,
      `Estado laboral: ${this.translateEmploymentStatus(screening.employmentStatus)}`,
      `Ingresos mensuales: €${screening.monthlyIncome.toLocaleString('es-ES')}`,
    ];
    
    tenantInfo.forEach((info) => {
      doc.text(info, 20, yPos);
      yPos += 6;
    });
    
    // Property Information
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos de la Propiedad', 20, yPos);
    doc.setFont('helvetica', 'normal');
    
    yPos += 10;
    doc.setFontSize(10);
    doc.text(`Dirección: ${screening.propertyAddress}`, 20, yPos);
    yPos += 6;
    doc.text(`Renta mensual: €${screening.monthlyRent.toLocaleString('es-ES')}`, 20, yPos);
    yPos += 6;
    const ratio = (screening.monthlyIncome / screening.monthlyRent).toFixed(2);
    doc.text(`Ratio ingresos/renta: ${ratio}x`, 20, yPos);
    
    // Fraud Alerts (if any)
    if (result.fraudFlags && result.fraudFlags.length > 0) {
      yPos += 15;

      // Check if we need a new page
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(254, 226, 226); // Light red background
      doc.roundedRect(15, yPos - 5, 180, 10 + (result.fraudFlags.length * 6), 2, 2, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Red text
      doc.text('⚠ Alertas de Fraude Detectadas', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      yPos += 8;
      doc.setFontSize(9);

      result.fraudFlags.forEach((flag) => {
        const severityBadge = `[${flag.severity.toUpperCase()}]`;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text(severityBadge, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        const flagText = doc.splitTextToSize(flag.description, 155);
        doc.text(flagText, 40, yPos);
        yPos += Math.max(flagText.length * 4, 6);
      });

      yPos += 5;
    }

    // Verification Results
    yPos += 15;

    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resultados de Verificación', 20, yPos);
    doc.setFont('helvetica', 'normal');

    yPos += 10;
    doc.setFontSize(10);

    const verifications = [
      { label: 'Identidad verificada', status: result.identityVerified },
      { label: 'Ingresos verificados', status: result.incomeVerified },
      { label: 'Historial crediticio', status: result.creditCheckPassed },
      { label: 'Referencias', status: result.referencesVerified },
    ];

    verifications.forEach((v) => {
      const symbol = v.status ? '✓' : '✗';
      const color = v.status ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number];
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(symbol, 20, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(v.label, 28, yPos);
      yPos += 7;
    });
    
    // Scoring Breakdown - Positive Factors
    if (result.explanation && result.explanation.topPositiveFactors && result.explanation.topPositiveFactors.length > 0) {
      yPos += 15;

      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(220, 252, 231); // Light green background
      doc.roundedRect(15, yPos - 5, 180, 10 + (result.explanation.topPositiveFactors.length * 9), 2, 2, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 163, 74); // Green text
      doc.text('✓ Factores Positivos', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      yPos += 8;
      doc.setFontSize(9);

      result.explanation.topPositiveFactors.forEach((factor) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 163, 74);
        doc.text(`+${factor.points} pts`, 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(factor.factor, 40, yPos);

        yPos += 5;
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(factor.description, 150);
        doc.text(descLines, 40, yPos);
        yPos += descLines.length * 4 + 3;
      });

      yPos += 2;
    }

    // Scoring Breakdown - Negative Factors
    if (result.explanation && result.explanation.topNegativeFactors && result.explanation.topNegativeFactors.length > 0) {
      yPos += 10;

      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(254, 226, 226); // Light red background
      doc.roundedRect(15, yPos - 5, 180, 10 + (result.explanation.topNegativeFactors.length * 9), 2, 2, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Red text
      doc.text('✗ Factores Negativos', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      yPos += 8;
      doc.setFontSize(9);

      result.explanation.topNegativeFactors.forEach((factor) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text(`${factor.points} pts`, 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(factor.factor, 40, yPos);

        yPos += 5;
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(factor.description, 150);
        doc.text(descLines, 40, yPos);
        yPos += descLines.length * 4 + 3;
      });

      yPos += 2;
    }

    // Notes
    yPos += 10;

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones', 20, yPos);
    doc.setFont('helvetica', 'normal');

    yPos += 10;
    doc.setFontSize(9);
    result.notes.forEach((note) => {
      const lines = doc.splitTextToSize(note, 170);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 5;
    });

    // Recommendations (new page if needed)
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 10;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recomendación Final', 20, yPos);
    doc.setFont('helvetica', 'normal');

    yPos += 10;
    doc.setFontSize(10);
    const recLines = doc.splitTextToSize(result.recommendations, 170);
    doc.text(recLines, 20, yPos);
    yPos += recLines.length * 5;

    // GDPR Compliance Section - Improvement Suggestions
    if (result.explanation && result.explanation.improvementSuggestions && result.explanation.improvementSuggestions.length > 0) {
      yPos += 15;

      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(245, 245, 245); // Light gray background
      doc.roundedRect(15, yPos - 5, 180, 10 + (result.explanation.improvementSuggestions.length * 6), 2, 2, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(75, 85, 99); // Gray text
      doc.text('💡 Sugerencias de Mejora (GDPR Art. 22)', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      yPos += 8;
      doc.setFontSize(9);

      result.explanation.improvementSuggestions.forEach((suggestion) => {
        const lines = doc.splitTextToSize(`• ${suggestion}`, 165);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 4 + 2;
      });

      yPos += 3;
    }

    // Human Review Notice
    if (result.humanReviewAvailable) {
      yPos += 10;

      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(219, 234, 254); // Light blue background
      doc.roundedRect(15, yPos - 5, 180, 15, 2, 2, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235); // Blue text
      doc.text('ℹ Derecho a Revisión Humana (GDPR Art. 22)', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      yPos += 5;
      doc.setFontSize(8);
      const humanReviewText = 'Tiene derecho a solicitar una revisión manual de esta decisión automatizada. Contacte con su casero o con soporte@verificaya.com para más información.';
      const hrLines = doc.splitTextToSize(humanReviewText, 165);
      doc.text(hrLines, 20, yPos);
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        'Este informe es confidencial y solo debe ser utilizado para fines de selección de inquilino.',
        20,
        285
      );
      doc.text(`TenantScreen © 2025 - Página ${i} de ${pageCount}`, 150, 285);
    }
    
    return doc.output('blob');
  }
  
  private static translateEmploymentStatus(status: string): string {
    const translations: Record<string, string> = {
      employed: 'Empleado por cuenta ajena',
      'self-employed': 'Autónomo',
      student: 'Estudiante',
      unemployed: 'Desempleado',
    };
    return translations[status] || status;
  }

  private static translateRiskLevel(riskLevel: string): string {
    const translations: Record<string, string> = {
      low: 'BAJO',
      medium: 'MEDIO',
      high: 'ALTO',
      very_high: 'MUY ALTO',
    };
    return translations[riskLevel] || riskLevel.toUpperCase();
  }

  private static getRiskLevelColor(riskLevel: string): [number, number, number] {
    const colors: Record<string, [number, number, number]> = {
      low: [34, 197, 94],        // Green
      medium: [234, 179, 8],     // Yellow
      high: [249, 115, 22],      // Orange
      very_high: [239, 68, 68],  // Red
    };
    return colors[riskLevel] || [128, 128, 128]; // Default gray
  }
}
