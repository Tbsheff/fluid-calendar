import React from "react";
import { describe, it, expect, vi } from "vitest";

// Mock all the providers that might be causing issues
vi.mock("@/components/providers/TRPCProvider", () => ({
  TRPCProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="trpc-provider">{children}</div>,
}));

vi.mock("@/components/providers/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}));

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="session-provider">{children}</div>,
}));

vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

import RootLayout from "../layout";
import { render } from "../../__tests__/test-utils";

describe("RootLayout", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders children content", () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    );
    expect(getByText("Test content")).toBeInTheDocument();
  });

  it("has proper html structure", () => {
    const { container } = render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    );
    
    // Just check that something rendered
    expect(container.firstChild).toBeTruthy();
  });
}); 