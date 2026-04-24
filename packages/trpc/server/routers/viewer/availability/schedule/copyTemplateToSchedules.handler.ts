import { prisma } from "@calcom/prisma";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../../types";
import type { TCopyTemplateToSchedulesInput } from "./copyTemplateToSchedules.schema";

type CopyTemplateOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TCopyTemplateToSchedulesInput;
};

/**
 * Replaces each target schedule's working hours with a copy of the source schedule.
 */
export const copyTemplateToSchedulesHandler = async ({
  ctx,
  input,
}: CopyTemplateOptions): Promise<{
  updatedCount: number;
  updatedScheduleIds: number[];
}> => {
  const { sourceScheduleId, targetScheduleIds } = input;
  const userId = ctx.user.id;

  const source = await prisma.schedule.findFirst({
    where: {
      id: sourceScheduleId,
      userId,
    },
    select: {
      id: true,
      availability: {
        select: {
          days: true,
          startTime: true,
          endTime: true,
          date: true,
        },
      },
    },
  });

  if (!source) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Source schedule not found" });
  }

  const uniqueTargets = Array.from(new Set(targetScheduleIds.filter((id) => id !== sourceScheduleId)));

  // TODO(availability): replace per-destination loop with a single $transaction; left sequential for
  // upcoming audit notifications per target schedule.
  const updatedIds: number[] = [];

  for (const targetId of uniqueTargets) {
    const target = await prisma.schedule.findFirst({
      where: { id: targetId, userId },
      select: { id: true },
    });

    if (!target) {
      continue;
    }

    await prisma.availability.deleteMany({ where: { scheduleId: targetId } });

    if (source.availability.length) {
      await prisma.availability.createMany({
        data: source.availability.map((a) => ({
          days: a.days,
          startTime: a.startTime,
          endTime: a.endTime,
          date: a.date,
          scheduleId: targetId,
        })),
      });
    }

    updatedIds.push(targetId);
  }

  return { updatedCount: updatedIds.length, updatedScheduleIds: updatedIds };
};
