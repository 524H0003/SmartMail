import EditPane, { type EditPaneProps } from "./edit-pane";
import PromptPane from "./prompt-pane";

export default function Sidebar({
  isEdit,
  mailTemplate,
  onMailHtmlChange,
  editHtml,
}: {
  isEdit: boolean;
} & EditPaneProps) {
  return isEdit ? (
    <EditPane
      mailTemplate={mailTemplate!}
      onMailHtmlChange={(e) => onMailHtmlChange(e)}
      editHtml={editHtml}
    />
  ) : (
    <PromptPane />
  );
}
