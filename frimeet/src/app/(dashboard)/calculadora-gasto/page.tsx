"use client";

import { useState } from "react";
import { GastoForm } from "@/features/analytics/components/GastoForm";
import { GastoResult as GastoResultComponent } from "@/features/analytics/components/GastoResult";
import { usePredictGasto } from "@/features/analytics/hooks/usePredict";
import type { GastoFormData } from "@/features/analytics/schemas/gastoSchema";
import type { GastoResponse } from "@/features/analytics/types";
import { Wallet, BarChart2, Receipt } from "lucide-react";

// Mock response para desarrollo
const MOCK_RESPONSE: GastoResponse = {
  gasto_min: 8500,
  gasto_max: 14200,
  desglose: {
    lugar: 4500,
    comida: 3800,
    bebida: 2900,
    otros: 1200,
  },
};

export default function CalculadoraGastoPage() {
  const { mutate, isPending } = usePredictGasto();
  const [result, setResult] = useState<GastoResponse | null>(null);

  const handleSubmit = (data: GastoFormData) => {
    mutate(
      {
        tipo_lugar: data.tipo_lugar,
        num_asistentes: data.num_asistentes,
        duracion_horas: data.duracion_horas,
        incluye_comida: data.incluye_comida,
        incluye_bebida: data.incluye_bebida,
        ciudad: data.ciudad,
      },
      {
        onSuccess: (res) => setResult(res),
        onError: () => {
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
          <Wallet size={24} color="var(--color-primary-orange)" /> Calculadora de Inversión
        </h2>
        <p className="predict-card__desc">
          Estima el costo logístico de tu evento. Ingresa los datos del lugar y los asistentes,
          y nuestro modelo calculará un rango de gasto esperado.
        </p>
        <GastoForm onSubmit={handleSubmit} isPending={isPending} />
      </div>

      {/* Resultado */}
      <div className="predict-card">
        <h2 className="predict-card__title">
          <BarChart2 size={24} color="var(--color-primary-pink)" /> Estimación de costos
        </h2>
        {result ? (
          <GastoResultComponent data={result} />
        ) : (
          <div className="predict-empty">
            <Receipt size={48} className="predict-empty__icon" />
            <p className="predict-empty__text">
              Completa el formulario y presiona <strong>&quot;Calcular&quot;</strong> para ver
              la estimación de inversión.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
