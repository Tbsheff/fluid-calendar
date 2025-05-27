import { TRPCError } from "@trpc/server";

import {
  // checkAdminStatus, // Removed as it's no longer used by the isAdmin procedure
  getPublicSignupStatus,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from "@/lib/api/auth";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";
import {
  // CheckAdminStatusInputSchema, // Removed as it's no longer used
  PasswordResetInputSchema,
  PasswordResetRequestInputSchema,
  PublicSignupStatusInputSchema,
  RegisterUserInputSchema,
} from "./schemas";

/**
 * Auth router for authentication-related operations
 * Note: Some auth routes (like [...nextauth] and check-admin) remain as API routes
 * due to special session handling requirements
 */
export const authRouter = createTRPCRouter({
  /**
   * Check if the current authenticated user is an admin.
   * This procedure directly inspects the user's role from the session context.
   */
  isAdmin: protectedProcedure.query(({ ctx }) => {
    // The `protectedProcedure` ensures `ctx.session` and `ctx.session.user` exist.
    // If not, it would throw an UNAUTHORIZED error before this logic runs.
    return { isAdmin: ctx.session.user.role === "ADMIN" };
  }),

  /**
   * Check if public signup is enabled
   */
  getPublicSignupStatus: publicProcedure
    .input(PublicSignupStatusInputSchema)
    .query(async ({ input }) => {
      try {
        return await getPublicSignupStatus(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to check public signup status",
        });
      }
    }),

  /**
   * Register a new user
   */
  register: publicProcedure
    .input(RegisterUserInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await registerUser(input);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Public registration is disabled") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: error.message,
            });
          }
          if (error.message === "User with this email already exists") {
            throw new TRPCError({
              code: "CONFLICT",
              message: error.message,
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An error occurred during registration",
        });
      }
    }),

  /**
   * Request a password reset
   */
  requestPasswordReset: publicProcedure
    .input(PasswordResetRequestInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await requestPasswordReset(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An error occurred processing your request",
        });
      }
    }),

  /**
   * Reset password using a valid token
   */
  resetPassword: publicProcedure
    .input(PasswordResetInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await resetPassword(input);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Invalid or expired reset token") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An error occurred processing your request",
        });
      }
    }),
});
