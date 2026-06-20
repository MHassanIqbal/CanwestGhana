import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/index.css";
import App from "@/App.tsx";
import { MetaWrapper } from "@/components/meta/PageMeta.tsx";
import { Toaster } from "./components/ui/sonner";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MetaWrapper>
          <App />
        </MetaWrapper>
        <Toaster richColors />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
);
