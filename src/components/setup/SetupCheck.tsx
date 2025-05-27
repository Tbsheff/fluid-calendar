"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { trpc } from "@/lib/trpc/client";

// How often to check the setup status (in milliseconds)
// Default: 1 hour
const CHECK_INTERVAL = 60 * 60 * 1000;

export function SetupCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  // Move trpc.useUtils() to the top level of the component
  const utils = trpc.useUtils();

  useEffect(() => {
    // Skip check if already on setup page
    if (pathname === "/setup") {
      setLoading(false);
      return;
    }

    // Skip check if on the signin page to prevent redirect loops
    if (pathname === "/auth/signin") {
      setLoading(false);
      return;
    }

    // Skip check for API routes
    if (pathname.startsWith("/api")) {
      setLoading(false);
      return;
    }

    const shouldCheckSetup = () => {
      // If we've never checked before, we should check
      if (!hasChecked) return true;

      // If we've checked recently, don't check again
      if (lastChecked && Date.now() - lastChecked < CHECK_INTERVAL) {
        return false;
      }

      // Otherwise, check again
      return true;
    };

    const checkSetup = async () => {
      try {
        // If we don't need to check, just mark as loaded
        if (!shouldCheckSetup()) {
          setLoading(false);
          return;
        }

        // Now we can use the utils that were created at the top level
        const data = await utils.setup.checkStatus.fetch();

        // Update local state
        setHasChecked(true);
        setLastChecked(Date.now());

        // If setup is needed, redirect to setup page
        if (data.needsSetup) {
          // Add a custom header to track the redirect source
          const setupUrl = new URL("/setup", window.location.origin);
          // Use a special flag for tracking redirects
          sessionStorage.setItem("redirectedFromSetupCheck", "true");
          router.push(setupUrl.toString());
        }
      } catch (error) {
        console.error("Failed to check setup status:", error);
        // Mark as checked even if there was an error
        setHasChecked(true);
        setLastChecked(Date.now());
      } finally {
        setLoading(false);
      }
    };

    checkSetup();
  }, [
    pathname,
    router,
    hasChecked,
    lastChecked,
    utils.setup.checkStatus, // Add utils to dependencies
  ]);

  // Show loading state or render nothing
  return loading ? <div>Loading...</div> : null;
}
