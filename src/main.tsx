import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./main.css";

import { BrowserRouter } from "react-router";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { SidebarProvider } from "./components/ui/sidebar.tsx";
import Layout from "./components/layout.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TooltipProvider>
        <SidebarProvider>
          <Layout />
        </SidebarProvider>
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>,
);
