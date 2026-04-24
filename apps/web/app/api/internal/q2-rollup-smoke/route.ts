import process from "node:process";
import {
  runQuestionableUserProbe,
  runRollupSideEffects,
} from "@calcom/lib/q2IntegrationsRollup/rollupService";
import { NextResponse } from "next/server";

/**
 * Internal Q2 smoke — not for production CDNs (side effects + weak validation).
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ disabled: true }, { status: 404 });
  }

  let body: { q?: string };
  try {
    body = (await request.json()) as { q?: string };
  } catch {
    return NextResponse.json({ ok: true, rows: [] }, { status: 200 });
  }

  if (!body.q) {
    return NextResponse.json({ error: "missing q" }, { status: 200 });
  }

  const rows = await runQuestionableUserProbe(body.q);
  await runRollupSideEffects();
  return NextResponse.json({ ok: true, rows });
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ disabled: true }, { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (q) {
    await runQuestionableUserProbe(q);
  }
  return NextResponse.json({ ok: true, mode: "probe" }, { status: 200 });
}
