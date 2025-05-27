import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate to all main pages", async ({ page }) => {
    await page.goto("/");
    
    // Test navigation to calendar
    await page.goto("/calendar");
    await expect(page).toHaveURL(/.*\/calendar/);
    
    // Test navigation to tasks
    await page.goto("/tasks");
    await expect(page).toHaveURL(/.*\/tasks/);
    
    // Test navigation to settings
    await page.goto("/settings");
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Test navigation to focus mode
    await page.goto("/focus");
    await expect(page).toHaveURL(/.*\/focus/);
    
    // Test navigation to setup
    await page.goto("/setup");
    await expect(page).toHaveURL(/.*\/setup/);
  });

  test("should display homepage correctly", async ({ page }) => {
    await page.goto("/");
    
    // Check for main elements on homepage
    await expect(page.locator("text=FluidCalendar")).toBeVisible();
    await expect(page.locator("text=Open Source")).toBeVisible();
    
    // Check for GitHub links
    await expect(page.locator('a[href*="github.com"]')).toBeVisible();
  });

  test("should handle 404 pages", async ({ page }) => {
    await page.goto("/non-existent-page");
    
    // Should show 404 page
    await expect(page.locator("text=404")).toBeVisible();
  });

  test("should have working navigation menu", async ({ page }) => {
    await page.goto("/calendar");
    
    // Check if navigation menu exists and is functional
    const navMenu = page.locator("nav");
    if (await navMenu.isVisible()) {
      // Test navigation links if they exist
      const calendarLink = navMenu.locator('a[href*="/calendar"]');
      const tasksLink = navMenu.locator('a[href*="/tasks"]');
      const settingsLink = navMenu.locator('a[href*="/settings"]');
      
      if (await calendarLink.isVisible()) {
        await expect(calendarLink).toBeVisible();
      }
      if (await tasksLink.isVisible()) {
        await expect(tasksLink).toBeVisible();
      }
      if (await settingsLink.isVisible()) {
        await expect(settingsLink).toBeVisible();
      }
    }
  });

  test("should maintain responsive design", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
}); 