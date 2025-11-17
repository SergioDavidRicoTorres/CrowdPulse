"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Card from "@/components/Card";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("session after sign-in", sessionData);
        if (signInError) throw signInError;
      }

      // Ensure session is established (cookies set) before navigation
      await supabase.auth.getUser();

      // Use replace to avoid staying in the auth history
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange((_event, session) => {
  //     if (session?.user) {
  //       router.replace("/dashboard");
  //     }
  //   });
  //   return () => subscription.unsubscribe();
  // }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 text-foreground">
            {isSignUp ? "Sign up" : "Log in"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? "Create an account to get started"
              : "Welcome back! Please log in to continue"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger text-danger text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : isSignUp ? "Sign up" : "Log in"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp
              ? "Already have an account? Log in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
  );
}
