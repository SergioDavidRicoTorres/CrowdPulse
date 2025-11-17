import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Button from "@/components/Button";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
          CrowdPulse
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Analytics platform for event organisers
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth?mode=signup">
            <Button>Sign up</Button>
          </Link>
          <Link href="/auth">
            <Button variant="secondary">Log in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
