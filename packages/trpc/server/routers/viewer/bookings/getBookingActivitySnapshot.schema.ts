import { z } from "zod";

export const ZGetBookingActivitySnapshotInputSchema = z.object({}).strict();

export type TGetBookingActivitySnapshotInput = z.infer<typeof ZGetBookingActivitySnapshotInputSchema>;
