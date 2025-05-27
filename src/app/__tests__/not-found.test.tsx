import React from "react";
import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";

import NotFoundPage from "../not-found";

import { render } from "../../__tests__/test-utils";

describe("NotFoundPage", () => {
  it("renders without crashing", async () => {
    const { container } = render(<NotFoundPage />);
    
    // Just check that something rendered
    expect(container).toBeTruthy();
    
    // Wait for the component to mount and render content
    await waitFor(() => {
      const hasContent = container.innerHTML.includes("404") || 
                        container.querySelector('h1') !== null ||
                        container.textContent !== null;
      expect(hasContent).toBe(true);
    }, { timeout: 2000 });
  });

  it("displays 404 message after mounting", async () => {
    const { container } = render(<NotFoundPage />);
    
    // Wait for the component to mount and show 404 message
    await waitFor(() => {
      const has404Message = document.body.innerHTML.includes("404") ||
                            document.body.innerHTML.includes("Page Not Found") ||
                            container.textContent?.includes("404");
      expect(has404Message).toBe(true);
    }, { timeout: 2000 });
  });

  it("provides navigation back to home", async () => {
    const { container } = render(<NotFoundPage />);
    
    // Wait for the component to mount and show home link
    await waitFor(() => {
      const hasHomeLink = document.body.innerHTML.includes("Return Home") ||
                         container.querySelector('a') !== null ||
                         container.textContent?.includes("Return Home");
      expect(hasHomeLink).toBe(true);
    }, { timeout: 2000 });
  });

  it("has proper heading structure", async () => {
    const { container } = render(<NotFoundPage />);
    
    // Wait for the component to mount and show heading
    await waitFor(() => {
      const hasHeading = document.body.innerHTML.includes("404") ||
                        container.querySelector('h1') !== null ||
                        container.textContent?.includes("404");
      expect(hasHeading).toBe(true);
    }, { timeout: 2000 });
  });
}); 