"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { RouterOutputs } from "@calcom/trpc/react";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { Checkbox } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";
import { revalidateAvailabilityList } from "app/(use-page-wrapper)/(main-nav)/availability/actions";
import type { ChangeEvent, JSX } from "react";
import { useId, useState } from "react";

type ScheduleListItem = { id: number; name: string | null };

type ScheduleTemplateBulkApplyProps = {
  schedules: ScheduleListItem[];
};

type CopyTemplateResult = RouterOutputs["viewer"]["availability"]["schedule"]["copyTemplateToSchedules"];

export function ScheduleTemplateBulkApply({ schedules }: ScheduleTemplateBulkApplyProps): JSX.Element {
  const { t } = useLocale();
  const listboxId = useId();
  const [sourceId, setSourceId] = useState<number | null>(schedules[0]?.id ?? null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const utils = trpc.useUtils();
  const mutation = trpc.viewer.availability.schedule.copyTemplateToSchedules.useMutation({
    onSuccess: async (data: CopyTemplateResult) => {
      showToast(t("template_applied_to_schedules", { count: data.updatedCount.toString() }), "success");
      await utils.viewer.availability.list.invalidate();
      revalidateAvailabilityList();
    },
    onError: (err: { message: string }) => {
      showToast(err.message, "error");
    },
  });

  if (schedules.length < 2) {
    return null;
  }

  if (!sourceId) {
    return null;
  }

  const targetIds = Object.entries(selected)
    .filter(([, checked]) => checked)
    .map(([id]) => Number(id))
    .filter((id) => id !== sourceId);

  return (
    <div className="mt-6 rounded-md border border-subtle bg-default p-4" data-testid="schedule-bulk-apply">
      <h3 className="mb-1 font-semibold text-default text-sm">{t("apply_hours_from_template")}</h3>
      <p className="mb-4 text-sm text-subtle">{t("apply_hours_from_template_description")}</p>
      <div className="stack-y-3">
        <div>
          <label className="mb-1 block font-medium text-default text-sm" htmlFor={listboxId}>
            {t("source_schedule")}
          </label>
          <select
            className="rounded-md border border-default bg-default px-3 py-2 text-default text-sm focus:ring-emphasis"
            id={listboxId}
            value={sourceId}
            onChange={(e: ChangeEvent<HTMLSelectElement>): void => {
              const v = Number(e.target.value);
              setSourceId(v);
            }}>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || t("default_schedule_name")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-2 font-medium text-default text-sm">{t("target_schedules")}</p>
          <ul className="stack-y-2">
            {schedules
              .filter((s) => s.id !== sourceId)
              .map((s) => {
                return (
                  <li key={s.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={!!selected[s.id]}
                      onCheckedChange={(checked: boolean | "indeterminate"): void => {
                        setSelected((prev) => ({ ...prev, [s.id]: checked === true }));
                      }}
                    />
                    <span className="text-default text-sm">{s.name || t("default_schedule_name")}</span>
                  </li>
                );
              })}
          </ul>
        </div>
        <div>
          <Button
            color="primary"
            loading={mutation.isPending}
            disabled={targetIds.length === 0}
            onClick={(): void => {
              mutation.mutate({ sourceScheduleId: sourceId, targetScheduleIds: targetIds });
            }}>
            {t("apply_template_hours")}
          </Button>
        </div>
      </div>
    </div>
  );
}
