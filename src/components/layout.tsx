import App from "@/App";
import Sidebar from "./sidebar";
import { SidebarInset } from "./ui/sidebar";
import { useLocation } from "react-router";
import { useEffect, useState } from "react";
import SidebarHeader from "./ui/sidebar-header";

export default function Layout() {
  const [isEdit, setIsEdit] = useState(true),
    [mailTemplate, setMailTemplate] = useState(""),
    [previewHtml, setPreviewHtml] = useState(""),
    { pathname } = useLocation();

  useEffect(() => {
    const exec = async () => {
      const templateName = pathname.split("/")[2],
        res = await fetch(`./templates/${templateName}.html`),
        text = await res.text();

      if (templateName == "") setIsEdit(false);
      else setMailTemplate(text);
    };
    exec();
  }, [pathname]);

  return (
    <>
      <Sidebar
        isEdit={isEdit}
        mailTemplate={mailTemplate}
        setPreviewHtml={setPreviewHtml}
      />
      <SidebarInset>
        <SidebarHeader />
        <App previewHtml={previewHtml} />
      </SidebarInset>
    </>
  );
}
