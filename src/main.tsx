import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import Layout from "./components/layout.tsx";
import { SidebarProvider } from "./components/ui/sidebar.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import "./index.css";
import "./main.css";

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
