import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getState } from "@/app/actions";
import DashboardClient from "./DashboardClient";
import AppShell from "@/app/components/AppShell";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const state = await getState();
  return (
    <AppShell title="Command deck" crumb="Home / Dashboard">
      <DashboardClient initialState={state} />
    </AppShell>
  );
}
