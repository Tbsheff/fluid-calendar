import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock admin hook using vi.hoisted to avoid hoisting issues
const mockUseAdmin = vi.hoisted(() => vi.fn(() => ({
  isAdmin: false,
  isLoading: false,
})));

// Mock config module to control isSaasEnabled
const mockConfig = vi.hoisted(() => ({
  isSaasEnabled: false,
  isFeatureEnabled: vi.fn(() => false),
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdmin: mockUseAdmin,
}));

vi.mock("@/lib/config", () => mockConfig);

// Mock settings components
vi.mock("@/components/settings/AccountManager", () => ({
  AccountManager: () => <div data-testid="account-manager">Account Manager Mock</div>,
}));

vi.mock("@/components/settings/UserSettings", () => ({
  UserSettings: () => <div data-testid="user-settings">User Settings Mock</div>,
}));

vi.mock("@/components/settings/SystemSettings", () => ({
  SystemSettings: () => <div data-testid="system-settings">System Settings Mock</div>,
}));

// Mock dynamic imports properly
vi.mock("next/dynamic", () => ({
  default: () => {
    const MockComponent = () => <div data-testid="waitlist-page">Waitlist Mock</div>;
    return MockComponent;
  },
}));

import SettingsPage from "../page";
import { render, mockUseSession, mockUserSession, mockAdminSession } from "../../../../__tests__/test-utils";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mocks
    mockUseAdmin.mockReturnValue({ isAdmin: false, isLoading: false });
    mockConfig.isSaasEnabled = false;
  });

  it("renders the settings page without crashing", () => {
    mockUseSession(mockUserSession(), "authenticated");
    const { container } = render(<SettingsPage />);
    expect(container).toBeInTheDocument();
  });

  it("renders basic user tabs", () => {
    mockUseSession(mockUserSession(), "authenticated");
    const { getByText } = render(<SettingsPage />);
    
    expect(getByText("Accounts")).toBeInTheDocument();
    expect(getByText("User")).toBeInTheDocument();
    expect(getByText("Calendar")).toBeInTheDocument();
  });

  it("shows admin tabs for admin users", () => {
    mockUseAdmin.mockReturnValue({ isAdmin: true, isLoading: false });
    
    mockUseSession(mockAdminSession(), "authenticated");
    const { getByText } = render(<SettingsPage />);
    
    expect(getByText("System")).toBeInTheDocument();
    expect(getByText("Logs")).toBeInTheDocument();
    expect(getByText("Users")).toBeInTheDocument();
  });

  it("shows SAAS tabs when SAAS features are enabled", () => {
    mockConfig.isSaasEnabled = true;
    mockUseAdmin.mockReturnValue({ isAdmin: true, isLoading: false });
    
    mockUseSession(mockAdminSession(), "authenticated");
    const { getByText } = render(<SettingsPage />);
    
    expect(getByText("Beta Waitlist")).toBeInTheDocument();
    expect(getByText("Admin Dashboard")).toBeInTheDocument();
  });

  it("denies access to admin tabs for regular users", () => {
    mockUseAdmin.mockReturnValue({ isAdmin: false, isLoading: false });
    
    mockUseSession(mockUserSession(), "authenticated");
    const { queryByText } = render(<SettingsPage />);
    
    expect(queryByText("System")).not.toBeInTheDocument();
    expect(queryByText("Logs")).not.toBeInTheDocument();
    expect(queryByText("Users")).not.toBeInTheDocument();
  });

  it("handles loading state", () => {
    mockUseAdmin.mockReturnValue({ isAdmin: false, isLoading: true });
    
    mockUseSession(mockUserSession(), "authenticated");
    const { container } = render(<SettingsPage />);
    expect(container).toBeInTheDocument();
  });
}); 