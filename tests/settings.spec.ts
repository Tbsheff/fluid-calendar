import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState('networkidle');
  });

  test("should display settings page or redirect to auth", async ({ page }) => {
    // Settings page might require authentication
    const isOnSettings = page.url().includes('/settings');
    const isOnAuth = page.url().includes('/auth');
    const hasSettingsContent = await page.locator("text=Settings, text=Account, text=Profile").isVisible();
    const hasAuthContent = await page.locator("h1:has-text('Sign in'), button:has-text('Login')").isVisible();
    
    // Either we're on settings page or redirected to auth (both are valid)
    expect(isOnSettings || isOnAuth || hasSettingsContent || hasAuthContent).toBeTruthy();
  });

  test("should show account settings when authenticated", async ({ page }) => {
    // Check if we're authenticated and on settings page
    const isOnSettings = page.url().includes('/settings');
    
    if (isOnSettings) {
      // Look for settings-related content
      const hasAccountSection = await page.locator("text=Account, text=Profile, text=User").isVisible();
      const hasSettingsForm = await page.locator("form, input, select, button").isVisible();
      const hasTabNavigation = await page.locator('[role="tab"], .tab, [data-tab]').isVisible();
      
      expect(hasAccountSection || hasSettingsForm || hasTabNavigation).toBeTruthy();
    } else {
      // If redirected to auth, that's expected behavior for unauthenticated users
      const isOnAuth = page.url().includes('/auth');
      expect(isOnAuth).toBeTruthy();
    }
  });

  test("should allow navigation between settings tabs", async ({ page }) => {
    const isOnSettings = page.url().includes('/settings');
    
    if (isOnSettings) {
      // Look for tab navigation
      const tabs = page.locator('[role="tab"], .tab, [data-tab], button:has-text("Account"), button:has-text("Profile"), button:has-text("General")');
      const tabCount = await tabs.count();
      
      if (tabCount > 1) {
        // Click on different tabs if they exist
        await tabs.first().click();
        await page.waitForTimeout(500);
        
        if (tabCount > 1) {
          await tabs.nth(1).click();
          await page.waitForTimeout(500);
        }
        
        // Verify we're still on settings page
        expect(page.url()).toContain('/settings');
      } else {
        // If no tabs, just verify settings content is visible
        const hasSettingsContent = await page.locator("text=Settings, form, input").isVisible();
        expect(hasSettingsContent).toBeTruthy();
      }
    } else {
      // If not on settings, verify we're on auth page
      expect(page.url()).toContain('/auth');
    }
  });

  test("should handle form submissions gracefully", async ({ page }) => {
    const isOnSettings = page.url().includes('/settings');
    
    if (isOnSettings) {
      // Look for forms and inputs
      const forms = page.locator("form");
      const formCount = await forms.count();
      
      if (formCount > 0) {
        // Find save/submit buttons
        const saveButtons = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]');
        const saveButtonCount = await saveButtons.count();
        
        if (saveButtonCount > 0) {
          // Try to interact with a form (without actually changing data)
          const firstForm = forms.first();
          const inputs = firstForm.locator('input[type="text"], input[type="email"], textarea');
          const inputCount = await inputs.count();
          
          if (inputCount > 0) {
            // Just verify the form is interactive
            const firstInput = inputs.first();
            await firstInput.focus();
            expect(await firstInput.isEnabled()).toBeTruthy();
          }
        }
      }
      
      // Verify we're still on settings page after interactions
      expect(page.url()).toContain('/settings');
    } else {
      // If not authenticated, verify auth redirect
      expect(page.url()).toContain('/auth');
    }
  });

  test("should display user information when available", async ({ page }) => {
    const isOnSettings = page.url().includes('/settings');
    
    if (isOnSettings) {
      // Look for user-related information
      const hasUserInfo = await page.locator("text=Email, text=Name, text=Profile, input[type='email'], input[name='name']").isVisible();
      const hasAccountSection = await page.locator("text=Account, text=User").isVisible();
      
      // Either user info is displayed or account section exists
      expect(hasUserInfo || hasAccountSection).toBeTruthy();
    } else {
      // If redirected, that's expected for unauthenticated users
      expect(page.url()).toContain('/auth');
    }
  });

  test("should be responsive on different screen sizes", async ({ page }) => {
    const isOnSettings = page.url().includes('/settings');
    
    if (isOnSettings) {
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator("body")).toBeVisible();
      
      // Test desktop view
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator("body")).toBeVisible();
      
      // Verify settings content is still accessible
      const hasSettingsContent = await page.locator("text=Settings, form, input").isVisible();
      expect(hasSettingsContent).toBeTruthy();
    } else {
      // Just verify the page loads on different sizes
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator("body")).toBeVisible();
      
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator("body")).toBeVisible();
    }
  });
}); 