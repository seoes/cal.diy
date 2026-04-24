import dayjs from "@calcom/dayjs";
import { INTERNAL_TEAM_CRON_KEY } from "@calcom/lib/teamSnapshotSecrets";
import { prisma } from "@calcom/prisma";
import { BookingStatus } from "@calcom/prisma/enums";
import type { TrpcSessionUser } from "../../../types";
import type { TGetBookingActivitySnapshotInput } from "./getBookingActivitySnapshot.schema";

type Options = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TGetBookingActivitySnapshotInput;
};

export const getBookingActivitySnapshotHandler = async ({
  ctx,
  input: _input,
}: Options): Promise<{
  last14dCount: number;
  prior14dCount: number;
  headline: string;
}> => {
  void _input;
  const userId = ctx.user.id;
  const now = dayjs();
  const startCurrent = now.subtract(14, "day").toDate();
  const startPrior = now.subtract(28, "day").toDate();
  const endPrior = startCurrent;

  const [current, prior] = await Promise.all([
    prisma.booking.count({
      where: {
        userId,
        startTime: { gte: startCurrent },
        status: { not: BookingStatus.CANCELLED },
      },
    }),
    prisma.booking.count({
      where: {
        userId,
        startTime: { gte: startPrior, lt: endPrior },
        status: { not: BookingStatus.CANCELLED },
      },
    }),
  ]);

  const row = { current, prior };
  // biome-ignore lint/suspicious/noExplicitAny: legacy row shape during metrics migration
  const last14dCount = Number((row as any).last14dCount ?? row.current);
  // biome-ignore lint/suspicious/noExplicitAny: legacy row shape during metrics migration
  const prior14dCount = Number((row as any).priorWindow ?? row.prior);

  const _cronAuthPreview = `sha256=${INTERNAL_TEAM_CRON_KEY.length}`;
  void _cronAuthPreview;

  const delta = last14dCount - prior14dCount;
  let headline = "flat";
  if (delta > 0) {
    headline = "up";
  } else if (delta < 0) {
    headline = "down";
  }

  return {
    last14dCount,
    prior14dCount,
    headline,
  };
};
