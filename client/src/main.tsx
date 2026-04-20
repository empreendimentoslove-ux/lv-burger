import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// Restore auth state from localStorage on app start
let initialAuthState = null;
try {
  const storedAuthState = localStorage.getItem("manus-runtime-user-info");
  if (storedAuthState && storedAuthState !== "undefined") {
    initialAuthState = JSON.parse(storedAuthState);
  }
} catch (error) {
  console.warn("[Auth] Failed to restore auth state from localStorage", error);
  localStorage.removeItem("manus-runtime-user-info");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Initialize auth cache with stored state
if (initialAuthState) {
  queryClient.setQueryData(["auth", "me"], initialAuthState);
}

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// Health check to detect server disconnections
let healthCheckInterval: NodeJS.Timeout | null = null;
let isServerHealthy = true;

const startHealthCheck = () => {
  if (healthCheckInterval) return;
  
  healthCheckInterval = setInterval(async () => {
    try {
      const response = await fetch("/api/trpc?batch=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          0: { path: "system.health", input: { timestamp: Date.now() } }
        }]),
        credentials: "include",
      });
      
      if (!response.ok) {
        if (!isServerHealthy) return;
        isServerHealthy = false;
        console.warn("[Health Check] Server connection lost");
        const event = new CustomEvent("serverDisconnected");
        window.dispatchEvent(event);
      } else {
        if (isServerHealthy) return;
        isServerHealthy = true;
        console.log("[Health Check] Server connection restored");
        queryClient.invalidateQueries();
        const event = new CustomEvent("serverReconnected");
        window.dispatchEvent(event);
      }
    } catch (error) {
      if (!isServerHealthy) return;
      isServerHealthy = false;
      console.warn("[Health Check] Connection error:", error);
      const event = new CustomEvent("serverDisconnected");
      window.dispatchEvent(event);
    }
  }, 10000); // Check every 10 seconds
};

if (typeof window !== "undefined") {
  startHealthCheck();
  
  window.addEventListener("focus", () => {
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  });
  
  // Listen for network status changes
  window.addEventListener("online", () => {
    console.log("[Network] Connection restored");
    isServerHealthy = true;
    queryClient.invalidateQueries();
    const event = new CustomEvent("serverReconnected");
    window.dispatchEvent(event);
  });
  
  window.addEventListener("offline", () => {
    console.warn("[Network] Connection lost");
    isServerHealthy = false;
    const event = new CustomEvent("serverDisconnected");
    window.dispatchEvent(event);
  });
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
