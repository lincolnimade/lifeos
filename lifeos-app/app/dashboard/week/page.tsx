import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import WeekClient from "./WeekClient";
import AppShell from "@/app/components/AppShell";

export default async function WeekPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <AppShell title="Week view" crumb="Home / Dashboard / Week">
      <WeekClient />
    </AppShell>
  );
}
