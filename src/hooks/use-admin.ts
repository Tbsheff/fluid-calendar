"use client";

import { useSession } from "next-auth/react";
import type { User } from "next-auth"; // Attempting to import User type

import { trpc } from "@/lib/trpc/client";

// Define UserType. If `User` from `next-auth` is correctly imported, this will be specific.
// Otherwise, it will allow for undefined/null.
type UserType = User | undefined | null;

/**
 * Hook to check if the current user is an admin
 * @returns {object} Object containing isAdmin, isLoading, error, and user
 */
export function useAdmin(): {
  isAdmin: boolean;
  isLoading: boolean;
  error: unknown; // Or a more specific TRPC error type if available
  user: UserType;
} {
  const { data: session, status: sessionStatus } = useSession();
  const {
    data: adminStatusData,
    isLoading: isAdminQueryLoading,
    error: isAdminError,
  } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: sessionStatus === "authenticated", // Only run query if authenticated
  });

  const isLoading = sessionStatus === "loading" || (sessionStatus === "authenticated" && isAdminQueryLoading);

  return {
    isAdmin: adminStatusData?.isAdmin || false,
    isLoading,
    error: isAdminError,
    user: session?.user as UserType, // Cast to UserType to satisfy the return type
  };
}
