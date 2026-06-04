import { z } from "zod";

export const gastoSchema = z.object({
  tipo_lugar: z.string().min(1, "Selecciona el tipo de lugar"),
  num_asistentes: z.coerce
    .number()
    .int()
    .min(1, "Debe haber al menos 1 asistente"),
  duracion_horas: z.coerce
    .number()
    .min(0.5, "Mínimo 30 minutos")
    .max(24, "Máximo 24 horas"),
  incluye_comida: z.boolean().optional(),
  incluye_bebida: z.boolean().optional(),
  ciudad: z.string().min(1, "Selecciona una ciudad"),
});

export type GastoFormData = z.infer<typeof gastoSchema>;
