"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aforoSchema, type AforoFormData } from "../schemas/aforoSchema";
import { Button } from "@/shared/components/ui/Button";
import { CalendarDays, Cloud, Users, MapPin, Clock, Target } from "lucide-react";

interface AforoFormProps {
  onSubmit: (data: AforoFormData) => void;
  isPending: boolean;
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const CLIMAS = ["Soleado", "Nublado", "Lluvioso", "Ventoso"];
const HORAS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, "0")}:00`;
});

export const AforoForm = ({ onSubmit, isPending }: AforoFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AforoFormData>({
    resolver: zodResolver(aforoSchema) as any,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="predict-form">
      <div className="predict-form__group">
        <label className="predict-form__label">
          <CalendarDays size={16} /> Día del evento
        </label>
        <select className="predict-form__select" {...register("dia_semana")}>
          <option value="">Seleccionar día...</option>
          {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        {errors.dia_semana && <span className="predict-form__error">{errors.dia_semana.message}</span>}
      </div>

      <div className="predict-form__group">
        <label className="predict-form__label">
          <Cloud size={16} /> Clima esperado
        </label>
        <select className="predict-form__select" {...register("clima")}>
          <option value="">Seleccionar clima...</option>
          {CLIMAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.clima && <span className="predict-form__error">{errors.clima.message}</span>}
      </div>

      <div className="predict-form__row">
        <div className="predict-form__group">
          <label className="predict-form__label">
            <Users size={16} /> Miembros actuales
          </label>
          <input
            type="number"
            className="predict-form__input"
            placeholder="150"
            {...register("miembros_actuales")}
          />
          {errors.miembros_actuales && <span className="predict-form__error">{errors.miembros_actuales.message}</span>}
        </div>

        <div className="predict-form__group">
          <label className="predict-form__label">
            <MapPin size={16} /> Capacidad del lugar
          </label>
          <input
            type="number"
            className="predict-form__input"
            placeholder="200"
            {...register("capacidad_lugar")}
          />
          {errors.capacidad_lugar && <span className="predict-form__error">{errors.capacidad_lugar.message}</span>}
        </div>
      </div>

      <div className="predict-form__group">
        <label className="predict-form__label">
          <Clock size={16} /> Hora de inicio
        </label>
        <select className="predict-form__select" {...register("hora_inicio")}>
          <option value="">Seleccionar hora...</option>
          {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        {errors.hora_inicio && <span className="predict-form__error">{errors.hora_inicio.message}</span>}
      </div>

      <Button type="submit" fullWidth variant="primary" size="lg" disabled={isPending}>
        {isPending ? (
          "Prediciendo..."
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} /> Predecir aforo
          </span>
        )}
      </Button>
    </form>
  );
};
