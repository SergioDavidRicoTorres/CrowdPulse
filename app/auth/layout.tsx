import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only redirect if we're certain the user is authenticated
  // This prevents race conditions during login
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
