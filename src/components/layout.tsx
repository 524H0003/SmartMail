import App from "@/App";
import Sidebar from "./sidebar";
import { SidebarInset } from "./ui/sidebar";
import { useLocation } from "react-router";
import { useEffect, useState } from "react";
import SidebarHeader from "./ui/sidebar-header";
import { decodeData, decompressTemplate } from "@/lib/utils";

export default function Layout() {
  const [isEdit, setIsEdit] = useState(true),
    [mailTemplate, setMailTemplate] = useState(""),
    [previewHtml, setPreviewHtml] = useState(""),
    { pathname, search } = useLocation();

  useEffect(() => {
    const exec = async () => {
      const params = new URLSearchParams(search),
        encodedHtml = params.get("html")?.replaceAll(/ /g, "+");

      if (encodedHtml) {
        const decodedTemplate = decodeData(encodedHtml);
        if (decodedTemplate) {
          setMailTemplate(decompressTemplate(decodedTemplate?.["template"]));
          return;
        }
      }

      const templateName = pathname.split("/")[2];

      if (!templateName || templateName === "") {
        setIsEdit(false);
        return;
      }

      try {
        const res = await fetch(`./templates/${templateName}.html`);

        if (res.ok) {
          const text = await res.text();
          setMailTemplate(text);
        } else {
          setIsEdit(false);
        }
      } catch {
        /* empty */
      }
    };
    exec();
  }, [pathname, search]);

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
