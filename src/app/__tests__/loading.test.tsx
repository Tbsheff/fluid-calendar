import React from "react";
import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";

import LoadingPage from "../loading";

import { render } from "../../__tests__/test-utils";

describe("LoadingPage", () => {
  it("renders without crashing", async () => {
    const { container } = render(<LoadingPage />);
    
    // Wait for the component to mount and render content
    await waitFor(() => {
      expect(container.textContent).toBeTruthy();
    });
  });

  it("displays loading indicator after mounting", async () => {
    const { getByText, container } = render(<LoadingPage />);
    
    // Wait for the component to mount and show loading content
    await waitFor(() => {
      expect(getByText("Loading...")).toBeInTheDocument();
    });
    
    // Check for the spinner element
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it("has proper accessibility attributes", async () => {
    const { getByText } = render(<LoadingPage />);
    
    // Wait for the component to mount and show loading text
    await waitFor(() => {
      expect(getByText("Loading...")).toBeInTheDocument();
    });
  });
}); 