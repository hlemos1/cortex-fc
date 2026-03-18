import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import {
  getReportSchedules,
  createReportSchedule,
  updateReportSchedule,
  deleteReportSchedule,
} from "@/db/queries/reports";

export async function GET(_req: NextRequest) {
  const { session, error } = await requireAuth();
  if (!session) return error;

  const schedules = await getReportSchedules(session.orgId);
  return NextResponse.json({ schedules });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (!session) return error;

  if (!hasPermission(session.role, "create_analysis")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { template, title, frequency, dayOfWeek, dayOfMonth, hour, timezone, recipientEmails } = body;

  if (!template || !frequency) {
    return NextResponse.json({ error: "template and frequency are required" }, { status: 400 });
  }

  if (!["daily", "weekly", "monthly"].includes(frequency)) {
    return NextResponse.json({ error: "frequency must be daily, weekly, or monthly" }, { status: 400 });
  }

  const schedule = await createReportSchedule({
    orgId: session.orgId,
    createdBy: session.userId,
    template,
    title,
    frequency,
    dayOfWeek,
    dayOfMonth,
    hour,
    timezone,
    recipientEmails,
  });

  return NextResponse.json({ schedule }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (!session) return error;

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updated = await updateReportSchedule(id, session.orgId, data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ schedule: updated });
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (!session) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await deleteReportSchedule(id, session.orgId);
  return NextResponse.json({ success: true });
}
