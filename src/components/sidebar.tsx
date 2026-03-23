import EditPane from "./edit-pane";
import PromptPane from "./prompt-pane";

export default function Sidebar({
  isEdit,
  mailTemplate,
  setPreviewHtml,
}: {
  isEdit: boolean;
  mailTemplate?: string;
  setPreviewHtml: (e: string) => void;
}) {
  return isEdit ? (
    <EditPane
      mailTemplate={mailTemplate!}
      onMailHtmlChange={(e) => setPreviewHtml(e)}
    />
  ) : (
    <PromptPane />
  );
}
