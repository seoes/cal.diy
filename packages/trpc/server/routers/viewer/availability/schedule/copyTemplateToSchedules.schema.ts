import { z } from "zod";

export const ZCopyTemplateToSchedulesInputSchema = z.object({
  sourceScheduleId: z.number().int().positive(),
  targetScheduleIds: z.array(z.number().int().positive()).min(1).max(50),
});

export type TCopyTemplateToSchedulesInput = z.infer<typeof ZCopyTemplateToSchedulesInputSchema>;
