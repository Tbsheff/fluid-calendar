"use client";

import { useState } from "react";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { logger } from "@/lib/logger";
import { trpc } from "@/lib/trpc/client";

const LOG_SOURCE = "SignInForm";

function isTRPCZodError(
  error: unknown
): error is { data: { zodError: { fieldErrors: Record<string, string[]> } } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as { data?: unknown }).data === "object" &&
    !!(error as { data: { zodError?: { fieldErrors?: unknown } } }).data
      ?.zodError?.fieldErrors
  );
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  );
}

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Use tRPC to check if public signup is enabled
  const { data: publicSignupEnabled = false } =
    trpc.auth.getPublicSignupStatus.useQuery({});

  // Use tRPC mutation for user registration
  const registerMutation = trpc.auth.register.useMutation();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Authentication failed", {
          description: "Please check your email and password and try again.",
        });
      } else {
        toast.success("Signed in successfully");

        // The token is set in the background, so we'll redirect after a minimal delay
        // to ensure the token is available for the next request
        setTimeout(() => {
          // Force a hard navigation to ensure the middleware re-evaluates with the new token
          window.location.href = "/calendar";
        }, 100);
      }
    } catch (error) {
      logger.error(
        "Error signing in",
        { error: error instanceof Error ? error.message : "Unknown error" },
        LOG_SOURCE
      );
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});
    setGeneralError(null);

    try {
      await registerMutation.mutateAsync({
        email,
        password,
        name: name || undefined, // Convert empty string to undefined
      });

      toast.success("Account created successfully", {
        description: "You can now sign in with your credentials.",
      });
      setActiveTab("signin");

      // Clear form fields
      setName("");
      setEmail("");
      setPassword("");
    } catch (error: unknown) {
      logger.error(
        "Error signing up",
        { error: error instanceof Error ? error.message : "Unknown error" },
        LOG_SOURCE
      );

      if (isTRPCZodError(error)) {
        setFieldErrors(error.data.zodError.fieldErrors);
        setGeneralError(null);
      } else if (isErrorWithMessage(error)) {
        setGeneralError(error.message);
      } else {
        setGeneralError("An error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Welcome to FluidCalendar
        </CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
        >
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            {publicSignupEnabled && (
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="text-right">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm text-muted-foreground"
                    onClick={() => router.push("/auth/reset-password")}
                    type="button"
                  >
                    Forgot password?
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          {publicSignupEnabled && (
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name (Optional)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {fieldErrors.name &&
                    fieldErrors.name.map((msg) => (
                      <div className="text-red-500 text-xs" key={msg}>
                        {msg}
                      </div>
                    ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {fieldErrors.email &&
                    fieldErrors.email.map((msg) => (
                      <div className="text-red-500 text-xs" key={msg}>
                        {msg}
                      </div>
                    ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {fieldErrors.password &&
                    fieldErrors.password.map((msg) => (
                      <div className="text-red-500 text-xs" key={msg}>
                        {msg}
                      </div>
                    ))}
                </div>
                {generalError && (
                  <div className="text-red-500 text-xs text-center">
                    {generalError}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || registerMutation.isPending}
                >
                  {isLoading || registerMutation.isPending
                    ? "Creating account..."
                    : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </CardFooter>
    </Card>
  );
}
