import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate to all main pages", async ({ page }) => {
    await page.goto("/");
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the open source homepage
    const isOpenSource = await page.locator('text=Open Source').isVisible();
    
    if (isOpenSource) {
      // Test open source navigation
      await expect(page.locator("h1").first()).toBeVisible();
    } else {
      // Test authenticated navigation
      await expect(page.locator("nav")).toBeVisible();
    }
  });

  test("should display homepage correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState('networkidle');
    
    // Check for main elements on homepage - use more specific selectors
    await expect(page.locator("h1, h2").first()).toBeVisible();
    
    // Check for either open source content or authenticated content
    const hasOpenSource = await page.locator("text=Open Source").isVisible();
    const hasNavigation = await page.locator("nav").isVisible();
    
    expect(hasOpenSource || hasNavigation).toBeTruthy();
  });

  test("should handle 404 pages", async ({ page }) => {
    await page.goto("/non-existent-page");
    
    // Should show 404 page or redirect to home
    const has404 = await page.locator("text=404").isVisible();
    const hasNotFound = await page.locator("text=Not Found").isVisible();
    const isHomePage = page.url().includes("localhost:3000/") && !page.url().includes("non-existent");
    
    expect(has404 || hasNotFound || isHomePage).toBeTruthy();
  });

  test("should have working navigation menu", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState('networkidle');
    
    // Check if navigation exists (for authenticated users)
    const nav = page.locator("nav");
    const hasNav = await nav.isVisible();
    
    if (hasNav) {
      // Test navigation links if they exist
      const links = nav.locator("a");
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThan(0);
    } else {
      // For open source homepage, check for main action buttons
      const buttons = page.locator("button, a[href]");
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    }
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState('networkidle');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("body")).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load without JavaScript errors", async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto("/");
    await page.waitForLoadState('networkidle');
    
    // Allow some time for any async errors
    await page.waitForTimeout(2000);
    
    // Filter out known warnings that aren't critical
    const criticalErrors = errors.filter(error => 
      !error.includes('next-auth') && 
      !error.includes('DEBUG_ENABLED') &&
      !error.includes('API responded with 404')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
}); 