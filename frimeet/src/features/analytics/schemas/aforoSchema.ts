import { z } from "zod";

export const aforoSchema = z.object({
  dia_semana: z.string().min(1, "Selecciona un día"),
  clima: z.string().min(1, "Selecciona el clima esperado"),
  miembros_actuales: z.coerce
    .number()
    .int()
    .min(1, "Debe haber al menos 1 miembro"),
  capacidad_lugar: z.coerce
    .number()
    .int()
    .min(1, "La capacidad debe ser mayor a 0"),
  hora_inicio: z.string().min(1, "Selecciona la hora de inicio"),
});

export type AforoFormData = z.infer<typeof aforoSchema>;
