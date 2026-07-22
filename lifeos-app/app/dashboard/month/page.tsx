import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MonthClient from "./MonthClient";
import AppShell from "@/app/components/AppShell";

export default async function MonthPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <AppShell title="Month view" crumb="Home / Dashboard / Month">
      <MonthClient />
    </AppShell>
  );
}
