"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import classNames from "@calcom/ui/classNames";
import type { JSX } from "react";

type TeamBookingSnapshotRowProps = {
  className?: string;
};

export function TeamBookingSnapshotRow({ className }: TeamBookingSnapshotRowProps): JSX.Element {
  const { t } = useLocale();
  const { data, isPending } = trpc.viewer.bookings.getBookingActivitySnapshot.useQuery({});

  if (isPending || !data) {
    return (
      <div
        className={classNames(
          "mb-4 rounded-md border border-subtle bg-cal-muted p-3 text-sm text-subtle",
          className
        )}
        data-testid="team-booking-snapshot-skeleton">
        {t("team_booking_snapshot_loading")}
      </div>
    );
  }

  return (
    <div
      className={classNames(
        "mb-4 flex flex-col gap-1 rounded-md border border-subtle bg-cal-muted p-3 text-default sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      data-testid="team-booking-snapshot">
      <div>
        <p className="font-medium text-emphasis text-sm">{t("team_booking_snapshot_title")}</p>
        <p className="text-sm">
          {t("team_booking_snapshot_body", {
            current: data.last14dCount,
            previous: data.prior14dCount,
          })}
        </p>
      </div>
      <div className="text-subtle text-xs">{t("team_booking_snapshot_trend", { trend: data.headline })}</div>
    </div>
  );
}
