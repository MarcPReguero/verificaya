import jsPDF from 'jspdf';
import { TenantScreening, ScreeningResult } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export class ReportService {
  static async generatePDFReport(
    screening: TenantScreening,
    result: ScreeningResult
  ): Promise<Blob> {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('TenantScreen', 20, 25);
    
    doc.setFontSize(12);
    doc.text('Informe de Verificación de Inquilino', 20, 33);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Date and ID
    doc.setFontSize(10);
    doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`, 150, 50);
    doc.text(`ID: ${screening.id.substring(0, 8)}`, 150, 56);
    
    // Score Box
    let yPos = 70;
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
    
    // Tenant Information
    yPos = 100;
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
    
    // Verification Results
    yPos += 15;
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
    
    // Notes
    yPos += 10;
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
}
