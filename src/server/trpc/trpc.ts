import { decode } from "next-auth/jwt";

import { TRPCError, initTRPC } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "tRPC";

/**
 * Creates context for tRPC procedures
 * This runs for every tRPC procedure call
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const { req } = opts;

  // Extract session from NextAuth JWT token
  let session = null;
  let userId: string | undefined = undefined;

  try {
    // Extract cookies from request headers
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      // Parse cookies to find the session token
      const cookies = cookieHeader.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          if (key && value) {
            acc[key] = decodeURIComponent(value);
          }
          return acc;
        },
        {} as Record<string, string>
      );

      // Look for NextAuth session token
      const sessionToken =
        cookies["next-auth.session-token"] ||
        cookies["__Secure-next-auth.session-token"];

      if (sessionToken) {
        // Decode the JWT token to get session data
        const token = await decode({
          token: sessionToken,
          secret:
            process.env.NEXTAUTH_SECRET ||
            "EM2RYkch0Uj+Qt2Cu0eDCmo/kv0MenNnHUaciNAjSrM=",
        });

        if (token && token.sub) {
          // Create a session-like object
          session = {
            user: {
              id: token.sub,
              email: token.email as string,
              name: token.name as string,
              role: token.role as string,
            },
            expires: new Date((token.exp as number) * 1000).toISOString(),
          };
          userId = token.sub;

          logger.info(
            "tRPC session extracted successfully from JWT",
            { userId, hasSession: !!session },
            LOG_SOURCE
          );
        }
      }
    }
  } catch (error) {
    logger.warn(
      "Failed to extract session in tRPC context",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
  }

  return {
    req,
    session,
    userId,
    prisma,
    logger,
  };
};

/**
 * Initialize tRPC with context and configuration
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create tRPC router
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.userId) {
    logger.warn(
      "Unauthorized access attempt to protected procedure",
      { hasSession: !!ctx.session, hasUserId: !!ctx.userId },
      LOG_SOURCE
    );
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      // Ensure we have the session and user data
      session: ctx.session,
      userId: ctx.userId,
    },
  });
});

/**
 * Admin procedure - requires admin role
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  // For now, we'll implement proper role checking later when session is working
  // TODO: Check if user has admin role once session extraction is implemented

  return next({ ctx });
});

/**
 * Middleware for input logging (useful for debugging)
 */
export const loggedProcedure = t.procedure.use(
  ({ path, type, next, input }) => {
    logger.info(
      `tRPC ${type} call`,
      { path, input: JSON.stringify(input) },
      LOG_SOURCE
    );

    return next();
  }
);
