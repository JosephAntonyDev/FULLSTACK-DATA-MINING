import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios';
import type { KpiData, ClubRanking, TrendPoint } from '../types';

// ─── Datos mock para desarrollo ───

const MOCK_KPI: KpiData = {
  totalEventos: 1_284,
  totalAsistentes: 38_420,
  clubsVerificados: 156,
  tasaOcupacion: 78.4,
  eventosTrend: 12.5,
  asistentesTrend: 8.3,
  clubsTrend: 5.1,
  ocupacionTrend: -2.3,
};

const MOCK_CLUBS: ClubRanking[] = [
  { posicion: 1, nombre: "Guerreras Kpop", miembros: 274_000, eventos: 48, rating: 4.9 },
  { posicion: 2, nombre: "Runners CDMX", miembros: 182_000, eventos: 96, rating: 4.8 },
  { posicion: 3, nombre: "Foodies MX", miembros: 145_000, eventos: 72, rating: 4.7 },
  { posicion: 4, nombre: "Tech Meetup", miembros: 98_000, eventos: 36, rating: 4.6 },
  { posicion: 5, nombre: "Capibrothers", miembros: 67_000, eventos: 24, rating: 4.5 },
];

const MOCK_TRENDS: TrendPoint[] = [
  { mes: "Ene", eventos: 84, asistentes: 2_100 },
  { mes: "Feb", eventos: 96, asistentes: 2_540 },
  { mes: "Mar", eventos: 112, asistentes: 3_020 },
  { mes: "Abr", eventos: 105, asistentes: 2_830 },
  { mes: "May", eventos: 138, asistentes: 3_890 },
  { mes: "Jun", eventos: 152, asistentes: 4_250 },
  { mes: "Jul", eventos: 168, asistentes: 5_010 },
  { mes: "Ago", eventos: 145, asistentes: 4_400 },
  { mes: "Sep", eventos: 130, asistentes: 3_700 },
  { mes: "Oct", eventos: 156, asistentes: 4_600 },
  { mes: "Nov", eventos: 174, asistentes: 5_280 },
  { mes: "Dic", eventos: 124, asistentes: 3_800 },
];

export const useEventosResumen = () => {
  return useQuery<KpiData>({
    queryKey: ['eventos-resumen'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/olap/eventos/resumen');
        // Map backend response to KpiData
        return {
          totalEventos: data.total_eventos || 0,
          totalAsistentes: Math.round((data.total_eventos || 0) * (data.avg_asistentes || 0)),
          clubsVerificados: 156, // Mock fallback as backend doesn't provide this yet
          tasaOcupacion: data.por_aforo?.find((a: any) => a.status === 'lleno')?.pct || 0,
          eventosTrend: 12.5,
          asistentesTrend: 8.3,
          clubsTrend: 5.1,
          ocupacionTrend: -2.3,
        } as KpiData;
      } catch {
        // Fallback a mock data en desarrollo
        return MOCK_KPI;
      }
    },
  });
};

export const useClubsRanking = () => {
  return useQuery<ClubRanking[]>({
    queryKey: ['clubs-ranking'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/olap/clubs/ranking?top=5');
        return data.map((item: any, index: number) => ({
          posicion: index + 1,
          nombre: item.club_nombre || 'Desconocido',
          miembros: item.total_asistentes || 0,
          eventos: item.total_eventos || 0,
          rating: Number((4.0 + Math.random() * 0.9).toFixed(1)), // Mock rating
        })) as ClubRanking[];
      } catch {
        return MOCK_CLUBS;
      }
    },
  });
};

export const useTendencias = () => {
  return useQuery<TrendPoint[]>({
    queryKey: ['tendencias'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/olap/tiempo/tendencias');
        return data.map((item: any) => ({
          mes: item.periodo ? item.periodo.substring(0, 7) : 'N/A',
          eventos: item.num_eventos || 0,
          asistentes: Math.round((item.num_eventos || 0) * (item.avg_asistentes || 0)),
        })) as TrendPoint[];
      } catch {
        return MOCK_TRENDS;
      }
    },
  });
};
