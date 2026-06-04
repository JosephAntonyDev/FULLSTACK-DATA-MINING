"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gastoSchema, type GastoFormData } from "../schemas/gastoSchema";
import { Button } from "@/shared/components/ui/Button";
import { Building2, Users, Clock, UtensilsCrossed, Wine, MapPin, Calculator } from "lucide-react";

interface GastoFormProps {
  onSubmit: (data: GastoFormData) => void;
  isPending: boolean;
}

const TIPOS_LUGAR = ["Bar", "Restaurante", "Parque", "Salón de eventos", "Terraza", "Centro nocturno"];
const CIUDADES = ["CDMX", "Guadalajara", "Monterrey", "Puebla", "Querétaro", "Mérida", "Cancún"];

export const GastoForm = ({ onSubmit, isPending }: GastoFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<GastoFormData>({
    resolver: zodResolver(gastoSchema) as any,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="predict-form">
      <div className="predict-form__group">
        <label className="predict-form__label">
          <Building2 size={16} /> Tipo de lugar
        </label>
        <select className="predict-form__select" {...register("tipo_lugar")}>
          <option value="">Seleccionar tipo...</option>
          {TIPOS_LUGAR.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.tipo_lugar && <span className="predict-form__error">{errors.tipo_lugar.message}</span>}
      </div>

      <div className="predict-form__row">
        <div className="predict-form__group">
          <label className="predict-form__label">
            <Users size={16} /> Asistentes estimados
          </label>
          <input
            type="number"
            className="predict-form__input"
            placeholder="50"
            {...register("num_asistentes")}
          />
          {errors.num_asistentes && <span className="predict-form__error">{errors.num_asistentes.message}</span>}
        </div>

        <div className="predict-form__group">
          <label className="predict-form__label">
            <Clock size={16} /> Duración (horas)
          </label>
          <input
            type="number"
            step="0.5"
            className="predict-form__input"
            placeholder="3"
            {...register("duracion_horas")}
          />
          {errors.duracion_horas && <span className="predict-form__error">{errors.duracion_horas.message}</span>}
        </div>
      </div>

      <div className="predict-form__toggles">
        <Controller
          name="incluye_comida"
          control={control}
          render={({ field }) => (
            <label className="predict-form__toggle-item">
              <input
                type="checkbox"
                checked={field.value || false}
                onChange={field.onChange}
                className="predict-form__checkbox"
              />
              <UtensilsCrossed size={16} />
              <span>Incluye comida</span>
            </label>
          )}
        />
        <Controller
          name="incluye_bebida"
          control={control}
          render={({ field }) => (
            <label className="predict-form__toggle-item">
              <input
                type="checkbox"
                checked={field.value || false}
                onChange={field.onChange}
                className="predict-form__checkbox"
              />
              <Wine size={16} />
              <span>Incluye bebida</span>
            </label>
          )}
        />
      </div>

      <div className="predict-form__group">
        <label className="predict-form__label">
          <MapPin size={16} /> Ciudad
        </label>
        <select className="predict-form__select" {...register("ciudad")}>
          <option value="">Seleccionar ciudad...</option>
          {CIUDADES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.ciudad && <span className="predict-form__error">{errors.ciudad.message}</span>}
      </div>

      <Button type="submit" fullWidth variant="primary" size="lg" disabled={isPending}>
        {isPending ? (
          "Calculando..."
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={18} /> Calcular inversión
          </span>
        )}
      </Button>
    </form>
  );
};
