import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { AppProviders } from "@/app/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";
import App from "@/app/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
      <Toaster />
    </AppProviders>
  </StrictMode>
);
