import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js dynamic imports
vi.mock("next/dynamic", () => ({
  default: (fn: () => React.ComponentType<unknown>) => {
    const Component = fn();
    return Component;
  },
}));

// Mock Next.js fonts
vi.mock("next/font/local", () => ({
  default: () => ({
    className: "mocked-font",
    variable: "--font-mocked",
  }),
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: "loading",
    update: vi.fn(),
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_ENABLE_SAAS_FEATURES = "false";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXTAUTH_SECRET = "test-secret";

// Mock tRPC
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useContext: vi.fn(),
    useUtils: vi.fn(() => ({
      tasks: {
        getAll: {
          invalidate: vi.fn(),
        },
      },
      projects: {
        getAll: {
          invalidate: vi.fn(),
        },
      },
    })),
    tasks: {
      getAll: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          error: null,
        })),
      },
      create: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      update: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      scheduleAll: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
    },
    projects: {
      getAll: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          error: null,
        })),
      },
      create: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      update: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
    },
    tags: {
      getAll: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          error: null,
        })),
      },
      create: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
    },
    auth: {
      requestPasswordReset: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      resetPassword: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
    },
    taskSync: {
      mappings: {
        getAll: {
          useQuery: vi.fn(() => ({
            data: [],
            isLoading: false,
            error: null,
          })),
        },
      },
      sync: {
        trigger: {
          useMutation: vi.fn(() => ({
            mutate: vi.fn(),
            isPending: false,
          })),
        },
      },
    },
  },
  trpcClient: {
    query: vi.fn(),
    mutate: vi.fn(),
  },
}));

// Mock Zustand stores
vi.mock("@/store/ui", () => ({
  useUIStore: vi.fn(() => ({
    commandPaletteOpen: false,
    setCommandPaletteOpen: vi.fn(),
    shortcutsModalOpen: false,
    setShortcutsModalOpen: vi.fn(),
  })),
}));

vi.mock("@/store/task-ui", () => ({
  useTaskUIStore: vi.fn(() => ({
    viewMode: "list",
    setViewMode: vi.fn(),
    selectedProjectId: null,
    setSelectedProjectId: vi.fn(),
    initialProjectId: null,
  })),
}));

// Mock canvas-confetti for celebration effects
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IntersectionObserver = class MockIntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = class MockResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
}; 