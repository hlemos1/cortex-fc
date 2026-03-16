import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db/index";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import DashboardShell from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.orgId) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, session.user.orgId as string),
      columns: { onboardingCompletedAt: true },
    });

    if (org && !org.onboardingCompletedAt) {
      redirect("/onboarding");
    }
  }

  return <DashboardShell>{children}</DashboardShell>;
}
