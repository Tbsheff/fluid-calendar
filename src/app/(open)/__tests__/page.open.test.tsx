import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import OpenSourceHomePage from "../page.open";

import { render, mockUseSession, mockUserSession } from "../../../__tests__/test-utils";

// Mock the router
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("OpenSourceHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it("renders the homepage without crashing", () => {
    mockUseSession(null, "unauthenticated");
    const { container } = render(<OpenSourceHomePage />);
    expect(container).toBeInTheDocument();
  });

  it("renders with authenticated user", () => {
    mockUseSession(mockUserSession(), "authenticated");
    const { container } = render(<OpenSourceHomePage />);
    expect(container).toBeInTheDocument();
  });

  it("renders main content elements", () => {
    mockUseSession(null, "unauthenticated");
    const { getAllByText, getByText } = render(<OpenSourceHomePage />);
    
    // FluidCalendar appears multiple times, so use getAllByText
    const fluidCalendarElements = getAllByText("FluidCalendar");
    expect(fluidCalendarElements.length).toBeGreaterThan(0);
    
    // Open Source should be unique
    expect(getByText("Open Source")).toBeInTheDocument();
  });
}); 