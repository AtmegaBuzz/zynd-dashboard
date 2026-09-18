import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/auth/server";
import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getServerAuth();

  if (!user) {
    redirect("/auth");
  }

  return <DashboardChrome>{children}</DashboardChrome>;
}
