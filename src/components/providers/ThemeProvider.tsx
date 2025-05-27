"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";

import { trpc } from "@/lib/trpc/client";

import { ThemeMode, UserSettings } from "@/types/settings";

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  forcedTheme?: ThemeMode;
  enableSystem?: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({
  children,
  attribute = "class",
  forcedTheme,
  enableSystem = true,
}: ThemeProviderProps) {
  // Get user settings via tRPC
  const { data: userSettings } = trpc.settings.get.useQuery(
    { type: "user" },
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );
  
  // Update user settings mutation
  const updateUserSettingsMutation = trpc.settings.update.useMutation();

  // Cast userSettings to UserSettings type (tRPC returns union type)
  const typedUserSettings = userSettings as UserSettings | undefined;

  // Use forcedTheme if provided, otherwise use user theme
  const currentTheme = forcedTheme || typedUserSettings?.theme || "system";

  // Function to apply theme to the DOM
  const applyTheme = useCallback(
    (theme: ThemeMode) => {
      const root = window.document.documentElement;

      // Remove both themes first from class
      root.classList.remove("light", "dark");

      // For data attributes other than class
      if (attribute !== "class") {
        root.removeAttribute(attribute);
      }

      // Handle system preference if enabled
      if (theme === "system" && enableSystem) {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";

        // Always add the class for Tailwind
        if (systemTheme === "dark") {
          root.classList.add("dark");
        }

        // Also set the attribute if different from class
        if (attribute !== "class") {
          root.setAttribute(attribute, systemTheme);
        }
      } else {
        // Apply the theme directly
        if (theme === "dark") {
          root.classList.add("dark");
        }

        // Also set the attribute if different from class
        if (attribute !== "class") {
          root.setAttribute(attribute, theme);
        }
      }
    },
    [attribute, enableSystem]
  );

  // Apply theme when it changes
  useEffect(() => {
    if (forcedTheme) {
      applyTheme(forcedTheme);
    } else {
      applyTheme(typedUserSettings?.theme || "system");
    }
  }, [typedUserSettings?.theme, forcedTheme, applyTheme]);

  // Listen for system theme changes if system preference is enabled
  useEffect(() => {
    if (
      forcedTheme ||
      !enableSystem ||
      (forcedTheme ? forcedTheme : typedUserSettings?.theme) !== "system"
    )
      return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [typedUserSettings?.theme, forcedTheme, enableSystem, applyTheme]);

  const setTheme = (theme: ThemeMode) => {
    // Always update the user settings
    updateUserSettingsMutation.mutate({
      type: "user",
      data: { theme },
    });

    // If forcedTheme is set, we don't apply the theme change directly
    // as the forcedTheme will override it in the UI
    if (!forcedTheme) {
      applyTheme(theme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
