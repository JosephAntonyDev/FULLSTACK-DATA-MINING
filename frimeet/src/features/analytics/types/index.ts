// ─── Dashboard / OLAP ───

export type KpiData = {
  totalEventos: number;
  totalAsistentes: number;
  clubsVerificados: number;
  tasaOcupacion: number;
  eventosTrend: number;
  asistentesTrend: number;
  clubsTrend: number;
  ocupacionTrend: number;
};

export type ClubRanking = {
  posicion: number;
  nombre: string;
  miembros: number;
  eventos: number;
  rating: number;
};

export type TrendPoint = {
  mes: string;
  eventos: number;
  asistentes: number;
};

// ─── Predicción de Aforo ───

export type AforoInput = {
  dia_semana: string;
  clima: string;
  miembros_actuales: number;
  capacidad_lugar: number;
  hora_inicio: string;
};

export type AforoResponse = {
  prediccion: "Lleno" | "Suficiente";
  confianza: number;
  recomendacion: string;
};

// ─── Predicción de Gasto ───

export type GastoInput = {
  tipo_lugar: string;
  num_asistentes: number;
  duracion_horas: number;
  incluye_comida: boolean;
  incluye_bebida: boolean;
  ciudad: string;
};

export type GastoResponse = {
  gasto_min: number;
  gasto_max: number;
  gasto_promedio_persona: number;
  desglose: {
    lugar: number;
    comida: number;
    bebida: number;
    otros: number;
  };
};
