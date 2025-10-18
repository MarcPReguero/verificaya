/**
 * ASNEF Credit Check Service
 * 
 * MODO MOCK - Simula consultas a ASNEF (Asociación Nacional de Establecimientos Financieros de Crédito)
 * 
 * En producción, reemplazar con integración real:
 * - ASNEF oficial: https://www.asnef.com
 * - Experian España: https://www.experian.es
 * - Equifax España: https://www.equifax.es
 * 
 * Costo real: €2-5 por consulta
 */

export interface CreditCheckRequest {
  documentType: 'DNI' | 'NIE' | 'Passport';
  documentNumber: string;
  fullName: string;
  birthDate?: string;
}

export interface DebtRecord {
  creditor: string; // Acreedor
  type: 'loan' | 'credit_card' | 'utilities' | 'telecom' | 'rent' | 'other';
  amount: number; // Importe en euros
  reportedDate: string; // Fecha de inclusión
  status: 'active' | 'paid' | 'in_dispute';
}

export interface CreditCheckResult {
  success: boolean;
  demoMode: boolean;
  
  // Información básica
  documentNumber: string;
  fullName: string;
  
  // Score crediticio (0-1000, modelo español)
  creditScore: number; // 0-400: Malo, 400-600: Regular, 600-800: Bueno, 800-1000: Excelente
  
  // Clasificación de riesgo
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  
  // Detalles de deudas
  hasActiveDebts: boolean;
  totalDebt: number;
  debtRecords: DebtRecord[];
  
  // Historial
  isInAsnef: boolean; // ¿Está en lista de morosos?
  monthsInAsnef: number;
  previousDebts: number; // Deudas saldadas anteriormente
  
  // Análisis
  analysis: {
    paymentBehavior: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
    debtToIncomeEstimate: number; // % estimado (si se proporciona ingreso)
    recommendation: 'approve' | 'approve_with_conditions' | 'review' | 'reject';
    warnings: string[];
    positives: string[];
  };
  
  // Metadata
  consultedAt: string;
  validUntil: string; // Validez de 30 días típicamente
}

export class AsnefService {
  
  /**
   * Simula consulta a ASNEF
   * En producción: Llamar a API real de ASNEF/Experian/Equifax
   */
  static async checkCredit(request: CreditCheckRequest): Promise<CreditCheckResult> {
    
    // Simular delay de API real (200-500ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
    
    // Generar datos mock basados en el documento (consistente para mismo documento)
    const mockProfile = this.generateMockProfile(request.documentNumber);
    
    const consultedAt = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    
    return {
      success: true,
      demoMode: true,
      
      documentNumber: request.documentNumber,
      fullName: request.fullName,
      
      creditScore: mockProfile.creditScore,
      riskLevel: mockProfile.riskLevel,
      
      hasActiveDebts: mockProfile.debtRecords.length > 0,
      totalDebt: mockProfile.totalDebt,
      debtRecords: mockProfile.debtRecords,
      
      isInAsnef: mockProfile.isInAsnef,
      monthsInAsnef: mockProfile.monthsInAsnef,
      previousDebts: mockProfile.previousDebts,
      
      analysis: mockProfile.analysis,
      
      consultedAt: consultedAt.toISOString(),
      validUntil: validUntil.toISOString(),
    };
  }
  
  /**
   * Genera perfil mock consistente basado en documento
   * (Mismo documento = mismo resultado)
   */
  private static generateMockProfile(documentNumber: string): {
    creditScore: number;
    riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    totalDebt: number;
    debtRecords: DebtRecord[];
    isInAsnef: boolean;
    monthsInAsnef: number;
    previousDebts: number;
    analysis: CreditCheckResult['analysis'];
  } {
    
    // Usar documento como seed para consistencia
    const seed = this.hashString(documentNumber);
    
    // 70% tienen buen historial, 20% regular, 10% malo
    const random = seed % 100;
    
    // Perfil BUENO (70% de casos)
    if (random < 70) {
      return {
        creditScore: 750 + (seed % 250), // 750-1000
        riskLevel: seed % 2 === 0 ? 'very_low' : 'low',
        totalDebt: 0,
        debtRecords: [],
        isInAsnef: false,
        monthsInAsnef: 0,
        previousDebts: seed % 3, // 0-2 deudas antiguas saldadas
        analysis: {
          paymentBehavior: seed % 2 === 0 ? 'excellent' : 'good',
          debtToIncomeEstimate: 0,
          recommendation: 'approve',
          warnings: [],
          positives: [
            'Sin deudas activas registradas',
            'Sin inclusiones en ficheros de morosos',
            'Historial de pagos favorable',
          ],
        },
      };
    }
    
    // Perfil REGULAR (20% de casos)
    if (random < 90) {
      const hasMinorDebt = seed % 3 === 0;
      
      return {
        creditScore: 500 + (seed % 200), // 500-700
        riskLevel: 'medium',
        totalDebt: hasMinorDebt ? 150 + (seed % 500) : 0,
        debtRecords: hasMinorDebt ? [{
          creditor: this.getRandomCreditor(seed),
          type: this.getRandomDebtType(seed),
          amount: 150 + (seed % 500),
          reportedDate: this.getRecentDate(seed % 12),
          status: 'active',
        }] : [],
        isInAsnef: hasMinorDebt,
        monthsInAsnef: hasMinorDebt ? (seed % 6) + 1 : 0,
        previousDebts: 1 + (seed % 2),
        analysis: {
          paymentBehavior: 'fair',
          debtToIncomeEstimate: hasMinorDebt ? 5 + (seed % 10) : 0,
          recommendation: hasMinorDebt ? 'approve_with_conditions' : 'approve',
          warnings: hasMinorDebt ? [
            'Deuda menor registrada en ASNEF',
            'Se recomienda solicitar aval o garantía adicional',
          ] : [
            'Historial con algunas irregularidades menores',
          ],
          positives: [
            'Deudas de bajo importe',
            'Sin impagos graves históricos',
          ],
        },
      };
    }
    
    // Perfil MALO (10% de casos)
    const debtAmount = 800 + (seed % 2000);
    
    return {
      creditScore: 200 + (seed % 300), // 200-500
      riskLevel: seed % 2 === 0 ? 'high' : 'very_high',
      totalDebt: debtAmount,
      debtRecords: [
        {
          creditor: this.getRandomCreditor(seed),
          type: 'rent',
          amount: Math.floor(debtAmount * 0.6),
          reportedDate: this.getRecentDate((seed % 18) + 6),
          status: 'active',
        },
        {
          creditor: this.getRandomCreditor(seed + 1),
          type: seed % 2 === 0 ? 'utilities' : 'credit_card',
          amount: Math.floor(debtAmount * 0.4),
          reportedDate: this.getRecentDate((seed % 12) + 3),
          status: 'active',
        },
      ],
      isInAsnef: true,
      monthsInAsnef: 6 + (seed % 18), // 6-24 meses
      previousDebts: 2 + (seed % 3),
      analysis: {
        paymentBehavior: seed % 2 === 0 ? 'poor' : 'very_poor',
        debtToIncomeEstimate: 20 + (seed % 30),
        recommendation: 'reject',
        warnings: [
          '⚠️ ALTO RIESGO: Inclusión activa en fichero ASNEF',
          `⚠️ Deuda total: €${debtAmount.toLocaleString('es-ES')}`,
          '⚠️ Múltiples impagos registrados',
          '⚠️ Historial de pagos muy deficiente',
          '❌ NO RECOMENDADO sin garantías sólidas',
        ],
        positives: [],
      },
    };
  }
  
  /**
   * Hash simple para convertir string en número consistente
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Obtiene nombre de acreedor realista español
   */
  private static getRandomCreditor(seed: number): string {
    const creditors = [
      'Banco Santander',
      'BBVA',
      'CaixaBank',
      'Bankinter',
      'Cofidis España',
      'Endesa Energía',
      'Iberdrola',
      'Vodafone España',
      'Orange España',
      'Naturgy',
      'Inmobiliaria Colonial SL',
      'Gestión de Alquileres BCN',
      'Visa España',
      'Mastercard',
    ];
    
    return creditors[seed % creditors.length];
  }
  
  /**
   * Obtiene tipo de deuda aleatorio
   */
  private static getRandomDebtType(seed: number): DebtRecord['type'] {
    const types: DebtRecord['type'][] = [
      'loan',
      'credit_card',
      'utilities',
      'telecom',
      'rent',
      'other',
    ];
    
    return types[seed % types.length];
  }
  
  /**
   * Genera fecha reciente (X meses atrás)
   */
  private static getRecentDate(monthsAgo: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Convierte score crediticio en puntos de scoring (0-30)
   * UPDATED: Increased from 25 to 30 points max - credit is most predictive factor
   */
  static creditScoreToPoints(creditScore: number): number {
    if (creditScore >= 800) return 30; // Excelente
    if (creditScore >= 700) return 25; // Muy bueno
    if (creditScore >= 600) return 20; // Bueno
    if (creditScore >= 500) return 12; // Regular
    if (creditScore >= 400) return 6;  // Malo
    return 0; // Muy malo
  }
  
  /**
   * Verifica si el servicio está configurado (en producción)
   */
  static isConfigured(): boolean {
    // En producción: Verificar si existe API key de ASNEF
    const asnefApiKey = process.env.ASNEF_API_KEY;
    return !!asnefApiKey;
  }
}
