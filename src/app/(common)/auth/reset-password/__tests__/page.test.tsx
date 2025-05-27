import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import ResetPasswordPage from "../page";

import { render, mockUseSession } from "../../../../../__tests__/test-utils";

// Mock auth components
vi.mock("@/components/auth/reset-password/ResetPasswordForm", () => ({
  ResetPasswordForm: () => <div data-testid="reset-password-form">Reset Password Form Mock</div>,
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the reset password page without crashing", () => {
    mockUseSession(null, "unauthenticated");
    const { container } = render(<ResetPasswordPage />);
    expect(container).toBeInTheDocument();
  });

  it("renders reset password form", () => {
    mockUseSession(null, "unauthenticated");
    const { container } = render(<ResetPasswordPage />);
    
    // Look for the actual form or the mocked component
    const form = container.querySelector('form') || 
                container.querySelector('[data-testid="reset-password-form"]');
    expect(form).toBeTruthy();
  });

  it("handles loading state", () => {
    mockUseSession(null, "loading");
    const { container } = render(<ResetPasswordPage />);
    expect(container).toBeInTheDocument();
  });
}); 