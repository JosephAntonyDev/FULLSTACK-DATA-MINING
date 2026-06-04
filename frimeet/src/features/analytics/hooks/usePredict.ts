import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/axios';
import type { AforoInput, AforoResponse, GastoInput, GastoResponse } from '../types';

// Helpers to map frontend UI inputs to backend ML features
const getDiaInt = (dia: string): number => {
  const dias: Record<string, number> = { "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4, "Viernes": 5, "Sábado": 6, "Domingo": 7 };
  return dias[dia] || 5;
};

// Hook para el Simulador de Aforo (Clasificación)
export const usePredictAforo = () => {
  return useMutation<AforoResponse, Error, AforoInput>({
    mutationFn: async (data) => {
      const diaInt = getDiaInt(data.dia_semana);
      const isWeekend = diaInt >= 5;
      
      const miembros = data.miembros_actuales || 10;
      const capacidad = data.capacidad_lugar || 100;
      // Calculate a realistic ratio based on capacity to trick the model into "Lleno" or "Suficiente"
      // Since the model only knows about members and attendees, not capacity.
      const fillRatio = Math.max(0.2, Math.min(1.0, miembros / capacidad));
      const asistentesConfirmados = Math.floor(miembros * fillRatio);

      const payload = {
        dia_semana: diaInt,
        condicion_clima: data.clima || "Despejado",
        temperatura: data.clima === "Lluvioso" ? 15.0 : 25.0, // Dynamic mock
        num_asistentes_confirmados: asistentesConfirmados,
        distancia_promedio_km: 8.0, // Mocked
        duracion_minutos: 120, // Mocked
        es_fin_de_semana: isWeekend,
        num_miembros_club: miembros,
        costo_promedio_lugar: 150.0 // Mocked
      };

      const response = await api.post('/predict/aforo', payload);
      const result = response.data;

      return {
        prediccion: result.prediccion === "lleno" ? "Lleno" : "Suficiente",
        confianza: result.probabilidad_lleno || 0,
        recomendacion: result.advertencia || "Las condiciones son óptimas según el historial.",
      };
    },
  });
};

// Hook para la Calculadora de Gasto (Regresión)
export const usePredictGasto = () => {
  return useMutation<GastoResponse, Error, GastoInput>({
    mutationFn: async (data) => {
      const payload = {
        num_asistentes: data.num_asistentes || 1,
        distancia_promedio_km: 8.0, // Mocked
        dia_semana: 6, // Mocked to Saturday
        duracion_minutos: (data.duracion_horas || 1) * 60,
        temperatura: 24.0, // Mocked
        es_fin_de_semana: true, // Mocked
        num_miembros_club: 100, // Mocked
        costo_promedio_lugar: data.tipo_lugar === "Restaurante" ? 400.0 : 200.0,
        nivel_precio: data.incluye_bebida && data.incluye_comida ? 4 : data.incluye_bebida || data.incluye_comida ? 3 : 2,
        categoria_lugar: data.tipo_lugar || "Bar"
      };

      const response = await api.post('/predict/gasto', payload);
      const result = response.data;
      const total = result.gasto_total_estimado_mxn || 0;

      return {
        gasto_min: result.rango_bajo_mxn || 0,
        gasto_max: result.rango_alto_mxn || 0,
        desglose: {
          lugar: Math.round(total * 0.4),
          comida: data.incluye_comida ? Math.round(total * 0.3) : 0,
          bebida: data.incluye_bebida ? Math.round(total * 0.2) : 0,
          otros: Math.round(total * (data.incluye_comida && data.incluye_bebida ? 0.1 : 0.6)),
        }
      };
    },
  });
};
