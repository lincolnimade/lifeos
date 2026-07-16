import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MonthClient from "./MonthClient";

export default async function MonthPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <MonthClient />;
}
