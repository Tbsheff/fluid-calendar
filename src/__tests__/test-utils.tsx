import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { vi } from "vitest";

// Mock session data types
export interface MockSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "USER";
  };
  expires: string;
}

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: TestWrapper, ...options });

// Special render function for full HTML components (error, not-found, loading pages)
const renderFullHTML = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper" | "container">
) => {
  // Create a container that can hold full HTML
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  const result = render(ui, { 
    container,
    ...options 
  });
  
  return result;
};

// Mock authentication helpers
export const mockUseSession = (session: MockSession | null = null, status: "loading" | "authenticated" | "unauthenticated" = "unauthenticated") => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useSession).mockReturnValue({
    data: session,
    status,
    update: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
};

export const mockAdminSession = (): MockSession => ({
  user: {
    id: "admin-1",
    email: "admin@test.com",
    name: "Admin User",
    role: "ADMIN",
  },
  expires: "2024-12-31T23:59:59.999Z",
});

export const mockUserSession = (): MockSession => ({
  user: {
    id: "user-1",
    email: "user@test.com",
    name: "Regular User",
    role: "USER",
  },
  expires: "2024-12-31T23:59:59.999Z",
});

// Environment variable helpers
export const mockSaasFeatures = (enabled: boolean = false) => {
  process.env.NEXT_PUBLIC_ENABLE_SAAS_FEATURES = enabled ? "true" : "false";
};

// Export everything from testing-library
export * from "@testing-library/react";
export { customRender as render, renderFullHTML };

// Export Vitest utilities
export { vi }; 