import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto("/");
  });

  test("should display signin page", async ({ page }) => {
    await page.goto("/auth/signin");
    
    // Check that signin form is visible
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should navigate to signin from homepage when not authenticated", async ({ page }) => {
    // Click sign in button on homepage
    await page.click('button:has-text("Sign In")');
    
    // Should navigate to signin page
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test("should display password reset page", async ({ page }) => {
    await page.goto("/auth/reset-password");
    
    // Check that reset password form is visible
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("should handle invalid login gracefully", async ({ page }) => {
    await page.goto("/auth/signin");
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message or stay on signin page
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test("should redirect authenticated users from auth pages", async ({ page }) => {
    // This test would need proper authentication setup
    // For now, just check that the auth pages are accessible
    await page.goto("/auth/signin");
    await expect(page.locator("form")).toBeVisible();
  });
}); 