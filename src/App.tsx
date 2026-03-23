import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable";
import EditPane from "./components/edit-pane";

function App() {
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
    <ResizablePanelGroup className="flex-col-reverse! lg:flex-row!">
      <ResizablePanel minSize="40%">
        {isEdit && (
          <EditPane
            onMailHtmlChange={(e) => setPreviewHtml(e)}
            mailTemplate={mailTemplate}
          />
        )}
      </ResizablePanel>
      <ResizablePanel minSize="60%">
        <div
          style={{ width: "100%" }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
