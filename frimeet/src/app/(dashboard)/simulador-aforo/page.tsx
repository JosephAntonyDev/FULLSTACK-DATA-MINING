"use client";

import { useState } from "react";
import { AforoForm } from "@/features/analytics/components/AforoForm";
import { AforoResult } from "@/features/analytics/components/AforoResult";
import { usePredictAforo } from "@/features/analytics/hooks/usePredict";
import type { AforoFormData } from "@/features/analytics/schemas/aforoSchema";
import type { AforoResponse } from "@/features/analytics/types";
import { Activity, Target, Wand2 } from "lucide-react";

// Mock response para desarrollo (se usa si la API no está disponible)
const MOCK_RESPONSE: AforoResponse = {
  prediccion: "Suficiente",
  confianza: 0.87,
  recomendacion:
    "El evento tiene buenas probabilidades de éxito. Se recomienda promocionar 48 horas antes para maximizar la asistencia.",
};

export default function SimuladorAforoPage() {
  const { mutate, isPending } = usePredictAforo();
  const [result, setResult] = useState<AforoResponse | null>(null);

  const handleSubmit = (data: AforoFormData) => {
    mutate(
      {
        dia_semana: data.dia_semana,
        clima: data.clima,
        miembros_actuales: data.miembros_actuales,
        capacidad_lugar: data.capacidad_lugar,
        hora_inicio: data.hora_inicio,
      },
      {
        onSuccess: (res) => setResult(res),
        onError: () => {
          // Fallback a mock en desarrollo
          setResult(MOCK_RESPONSE);
        },
      }
    );
  };

  return (
    <div className="predict-page">
      {/* Formulario */}
      <div className="predict-card">
        <h2 className="predict-card__title">
          <Activity size={24} color="var(--color-primary-pink)" /> Simulador de Éxito
        </h2>
        <p className="predict-card__desc">
          Ingresa los datos de tu evento planeado y nuestro modelo de Machine Learning
          predecirá si el lugar se llenará o tendrá espacio suficiente.
        </p>
        <AforoForm onSubmit={handleSubmit} isPending={isPending} />
      </div>

      {/* Resultado */}
      <div className="predict-card">
        <h2 className="predict-card__title">
          <Target size={24} color="var(--color-primary-orange)" /> Resultado de predicción
        </h2>
        {result ? (
          <AforoResult data={result} />
        ) : (
          <div className="predict-empty">
            <Wand2 size={48} className="predict-empty__icon" />
            <p className="predict-empty__text">
              Completa el formulario y presiona <strong>&quot;Predecir&quot;</strong> para ver
              el resultado de la predicción.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
