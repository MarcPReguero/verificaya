// Contenido mockup realista para verificaciones de inquilinos
// Datos basados en casos reales del mercado español

export interface MockTenant {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  edad: number;
  nacionalidad: string;
  ciudad: string;
  barrio: string;
  profesion: string;
  empresa: string;
  antiguedad_laboral: string;
  tipo_contrato: 'Indefinido' | 'Temporal' | 'Autónomo' | 'Funcionario';
  ingresos_mensuales: number;
  ingresos_anuales: number;
  alquiler_solicitado: number;
  ratio_ingresos: number; // ingresos / alquiler
  score_asnef: number; // 0-1000
  tiene_deudas: boolean;
  deudas_totales?: number;
  referencias_anteriores: number;
  meses_ultimo_alquiler?: number;
  motivo_cambio?: string;
  mascotas: boolean;
  fumador: boolean;
  vehiculo: boolean;
  observaciones?: string;
  fecha_solicitud: string;
  score_final: number; // 0-100
  recomendacion: 'Aprobar' | 'Revisar' | 'Rechazar';
  red_flags: string[];
  puntos_fuertes: string[];
}

export const mockTenants: MockTenant[] = [
  {
    id: 'T001',
    nombre: 'Laura',
    apellidos: 'Martínez García',
    dni: '45678912X',
    email: 'laura.martinez@email.com',
    telefono: '+34 612 345 678',
    edad: 28,
    nacionalidad: 'Española',
    ciudad: 'Barcelona',
    barrio: 'Eixample',
    profesion: 'Diseñadora UX/UI',
    empresa: 'Glovo Spain',
    antiguedad_laboral: '2 años y 4 meses',
    tipo_contrato: 'Indefinido',
    ingresos_mensuales: 2800,
    ingresos_anuales: 39200,
    alquiler_solicitado: 850,
    ratio_ingresos: 3.29,
    score_asnef: 820,
    tiene_deudas: false,
    referencias_anteriores: 2,
    meses_ultimo_alquiler: 24,
    motivo_cambio: 'Busca piso más cercano al trabajo',
    mascotas: false,
    fumador: false,
    vehiculo: true,
    observaciones: 'Siempre pagó puntualmente. Propietario anterior da excelentes referencias.',
    fecha_solicitud: '2025-10-10',
    score_final: 92,
    recomendacion: 'Aprobar',
    red_flags: [],
    puntos_fuertes: [
      'Ingresos estables y superiores a 3x el alquiler',
      'Contrato indefinido en empresa sólida',
      'Historial de pago impecable',
      'Sin deudas en ASNEF',
      'Referencias verificadas positivas'
    ]
  },
  {
    id: 'T002',
    nombre: 'Carlos',
    apellidos: 'Rodríguez López',
    dni: '52341876Y',
    email: 'c.rodriguez.mad@gmail.com',
    telefono: '+34 678 901 234',
    edad: 35,
    nacionalidad: 'Española',
    ciudad: 'Madrid',
    barrio: 'Chamberí',
    profesion: 'Profesor de instituto',
    empresa: 'Comunidad de Madrid - IES Cardenal Cisneros',
    antiguedad_laboral: '7 años',
    tipo_contrato: 'Funcionario',
    ingresos_mensuales: 2400,
    ingresos_anuales: 33600,
    alquiler_solicitado: 950,
    ratio_ingresos: 2.53,
    score_asnef: 750,
    tiene_deudas: true,
    deudas_totales: 1200,
    referencias_anteriores: 3,
    meses_ultimo_alquiler: 36,
    motivo_cambio: 'Propietario vende el piso',
    mascotas: true,
    fumador: false,
    vehiculo: false,
    observaciones: 'Tiene un gato. Deuda pequeña de €1.200 con Orange (disputa facturación). Funcionario estable.',
    fecha_solicitud: '2025-10-08',
    score_final: 78,
    recomendacion: 'Aprobar',
    red_flags: [
      'Ratio ingresos/alquiler ajustado (2.53x)',
      'Deuda activa de €1.200 en ASNEF'
    ],
    puntos_fuertes: [
      'Funcionario con plaza definitiva',
      'Historial largo de alquileres (3 pisos)',
      'Referencias muy positivas',
      'La deuda es una disputa, no impago real'
    ]
  },
  {
    id: 'T003',
    nombre: 'Ana',
    apellidos: 'González Fernández',
    dni: '47823651Z',
    email: 'ana.gf.valencia@hotmail.com',
    telefono: '+34 695 432 109',
    edad: 42,
    nacionalidad: 'Española',
    ciudad: 'Valencia',
    barrio: 'Ruzafa',
    profesion: 'Enfermera',
    empresa: 'Hospital La Fe',
    antiguedad_laboral: '14 años',
    tipo_contrato: 'Indefinido',
    ingresos_mensuales: 2200,
    ingresos_anuales: 30800,
    alquiler_solicitado: 700,
    ratio_ingresos: 3.14,
    score_asnef: 890,
    tiene_deudas: false,
    referencias_anteriores: 1,
    meses_ultimo_alquiler: 84,
    motivo_cambio: 'Separación matrimonial',
    mascotas: false,
    fumador: false,
    vehiculo: true,
    observaciones: 'Viene de vivir 7 años en un piso en propiedad compartida. Ahora busca alquiler tras separación.',
    fecha_solicitud: '2025-10-09',
    score_final: 88,
    recomendacion: 'Aprobar',
    red_flags: [],
    puntos_fuertes: [
      'Trabajo estable en sector sanitario',
      '14 años de antigüedad',
      'Ingresos muy superiores al alquiler',
      'Sin historial de impagos',
      'Profesional responsable'
    ]
  },
  {
    id: 'T004',
    nombre: 'David',
    apellidos: 'Moreno Sánchez',
    dni: '38912745K',
    email: 'david.moreno.freelance@gmail.com',
    telefono: '+34 621 876 543',
    edad: 31,
    nacionalidad: 'Española',
    ciudad: 'Barcelona',
    barrio: 'Poblenou',
    profesion: 'Desarrollador freelance',
    empresa: 'Autónomo - Varios clientes internacionales',
    antiguedad_laboral: '3 años',
    tipo_contrato: 'Autónomo',
    ingresos_mensuales: 3200,
    ingresos_anuales: 38400,
    alquiler_solicitado: 1200,
    ratio_ingresos: 2.67,
    score_asnef: 680,
    tiene_deudas: true,
    deudas_totales: 3500,
    referencias_anteriores: 2,
    meses_ultimo_alquiler: 18,
    motivo_cambio: 'Busca piso más grande para oficina en casa',
    mascotas: false,
    fumador: false,
    vehiculo: false,
    observaciones: 'Ingresos variables como freelance. Deuda de €3.500 con Vodafone. Últimas 3 declaraciones IRPF disponibles.',
    fecha_solicitud: '2025-10-11',
    score_final: 68,
    recomendacion: 'Revisar',
    red_flags: [
      'Ingresos variables (freelance)',
      'Deuda de €3.500 en ASNEF',
      'Ratio ajustado con alquiler alto'
    ],
    puntos_fuertes: [
      'Ingresos medios buenos (€3.200)',
      'Trabajo en tech con demanda',
      'Puede aportar declaraciones IRPF',
      'Referencias positivas del anterior propietario'
    ]
  },
  {
    id: 'T005',
    nombre: 'María',
    apellidos: 'Torres Ruiz',
    dni: '51234789M',
    email: 'mtorres.consultor@outlook.com',
    telefono: '+34 634 567 890',
    edad: 26,
    nacionalidad: 'Española',
    ciudad: 'Madrid',
    barrio: 'Malasaña',
    profesion: 'Consultora junior',
    empresa: 'Deloitte España',
    antiguedad_laboral: '10 meses',
    tipo_contrato: 'Temporal',
    ingresos_mensuales: 1800,
    ingresos_anuales: 25200,
    alquiler_solicitado: 750,
    ratio_ingresos: 2.4,
    score_asnef: 720,
    tiene_deudas: false,
    referencias_anteriores: 1,
    meses_ultimo_alquiler: 10,
    motivo_cambio: 'Finaliza alquiler de habitación, busca piso completo',
    mascotas: false,
    fumador: false,
    vehiculo: false,
    observaciones: 'Primer piso sola. Padres avalistas disponibles (ambos funcionarios). Contrato temporal con alta probabilidad de conversión.',
    fecha_solicitud: '2025-10-12',
    score_final: 72,
    recomendacion: 'Aprobar',
    red_flags: [
      'Contrato temporal (10 meses)',
      'Ratio justo (2.4x)',
      'Poca experiencia en alquileres'
    ],
    puntos_fuertes: [
      'Empresa de gran reputación',
      'Padres avalistas sólidos',
      'Sin deudas',
      'Joven profesional con proyección'
    ]
  },
  {
    id: 'T006',
    nombre: 'Javier',
    apellidos: 'Navarro Pérez',
    dni: '42876531L',
    email: 'javi.navarro88@gmail.com',
    telefono: '+34 667 234 891',
    edad: 37,
    nacionalidad: 'Española',
    ciudad: 'Sevilla',
    barrio: 'Triana',
    profesion: 'Camarero',
    empresa: 'Restaurante El Rinconcillo',
    antiguedad_laboral: '5 meses',
    tipo_contrato: 'Temporal',
    ingresos_mensuales: 1400,
    ingresos_anuales: 19600,
    alquiler_solicitado: 650,
    ratio_ingresos: 2.15,
    score_asnef: 480,
    tiene_deudas: true,
    deudas_totales: 8900,
    referencias_anteriores: 1,
    meses_ultimo_alquiler: 6,
    motivo_cambio: 'Impagos en anterior piso',
    mascotas: false,
    fumador: true,
    vehiculo: false,
    observaciones: 'Historial irregular. Deudas acumuladas: €5.200 Santander, €2.400 Vodafone, €1.300 Orange. Propietario anterior reporta 3 meses impagados.',
    fecha_solicitud: '2025-10-07',
    score_final: 38,
    recomendacion: 'Rechazar',
    red_flags: [
      'Deudas elevadas (€8.900)',
      'Score ASNEF muy bajo (480)',
      'Historial de impagos confirmado',
      'Ratio insuficiente (2.15x)',
      'Contrato temporal reciente',
      'Ingresos bajos'
    ],
    puntos_fuertes: [
      'Tiene trabajo actualmente'
    ]
  },
  {
    id: 'T007',
    nombre: 'Sofia',
    apellidos: 'Álvarez Jiménez',
    dni: 'X8765432R',
    email: 'sofia.alvarez.br@gmail.com',
    telefono: '+34 698 765 432',
    edad: 29,
    nacionalidad: 'Brasileña (NIE español)',
    ciudad: 'Barcelona',
    barrio: 'Gràcia',
    profesion: 'Marketing Manager',
    empresa: 'Amazon Barcelona',
    antiguedad_laboral: '1 año y 8 meses',
    tipo_contrato: 'Indefinido',
    ingresos_mensuales: 3500,
    ingresos_anuales: 49000,
    alquiler_solicitado: 1100,
    ratio_ingresos: 3.18,
    score_asnef: 0, // Sin historial en España
    tiene_deudas: false,
    referencias_anteriores: 1,
    meses_ultimo_alquiler: 20,
    motivo_cambio: 'Busca piso más luminoso',
    mascotas: true,
    fumador: false,
    vehiculo: false,
    observaciones: 'Sin historial crediticio en España (llegó hace 2 años). Puede aportar carta de empresa y extractos bancarios. Tiene perro pequeño.',
    fecha_solicitud: '2025-10-13',
    score_final: 82,
    recomendacion: 'Aprobar',
    red_flags: [
      'Sin historial ASNEF en España',
      'Tiene mascota (perro)'
    ],
    puntos_fuertes: [
      'Ingresos altos y estables',
      'Empresa multinacional sólida',
      'Contrato indefinido',
      'Propietario actual da excelentes referencias',
      'Puede aportar 6 meses de extractos'
    ]
  },
  {
    id: 'T008',
    nombre: 'Roberto',
    apellidos: 'Castillo Muñoz',
    dni: '49823156B',
    email: 'r.castillo.arquitecto@gmail.com',
    telefono: '+34 612 987 654',
    edad: 44,
    nacionalidad: 'Española',
    ciudad: 'Valencia',
    barrio: 'Benimaclet',
    profesion: 'Arquitecto',
    empresa: 'Estudio propio',
    antiguedad_laboral: '12 años',
    tipo_contrato: 'Autónomo',
    ingresos_mensuales: 2600,
    ingresos_anuales: 31200,
    alquiler_solicitado: 900,
    ratio_ingresos: 2.89,
    score_asnef: 710,
    tiene_deudas: true,
    deudas_totales: 2100,
    referencias_anteriores: 2,
    meses_ultimo_alquiler: 48,
    motivo_cambio: 'Busca piso con estudio/despacho',
    mascotas: false,
    fumador: false,
    vehiculo: true,
    observaciones: 'Deuda de €2.100 con Endesa (factura disputada). Autónomo con ingresos variables pero estable. Últimos 4 años de IRPF disponibles.',
    fecha_solicitud: '2025-10-09',
    score_final: 74,
    recomendacion: 'Aprobar',
    red_flags: [
      'Ingresos variables (autónomo)',
      'Deuda de €2.100 en ASNEF'
    ],
    puntos_fuertes: [
      '12 años como autónomo (estabilidad)',
      'Puede aportar declaraciones IRPF',
      'Referencias de 4 años en anterior piso',
      'La deuda es una disputa, no impago',
      'Profesional liberal establecido'
    ]
  }
];

export const mockStatistics = {
  total_verificaciones: 3247,
  aprobados: 2456,
  rechazados: 412,
  en_revision: 379,
  tasa_aprobacion: 75.6,
  score_medio: 76.4,
  ratio_ingresos_medio: 2.87,
  edad_media: 33.2,
  tiempo_medio_verificacion: '18 horas',
  ciudades_top: [
    { ciudad: 'Barcelona', verificaciones: 1124 },
    { ciudad: 'Madrid', verificaciones: 1089 },
    { ciudad: 'Valencia', verificaciones: 456 },
    { ciudad: 'Sevilla', verificaciones: 287 },
    { ciudad: 'Málaga', verificaciones: 291 }
  ],
  profesiones_top: [
    { profesion: 'Sector tecnología', porcentaje: 18.4 },
    { profesion: 'Sanitario/Educación', porcentaje: 15.2 },
    { profesion: 'Funcionarios', porcentaje: 12.8 },
    { profesion: 'Comercial/Ventas', porcentaje: 11.3 },
    { profesion: 'Hostelería', porcentaje: 9.1 }
  ]
};
