import Editor from "@monaco-editor/react";

import { Field, FieldLabel } from "./ui/field";

interface HtmlCodeEditorProps {
  htmlCode: string;
  onHtmlCodeChange: (value: string) => void;
}

export function HtmlCodeEditor({
  htmlCode,
  onHtmlCodeChange,
}: HtmlCodeEditorProps) {
  return (
    <Field className="col-span-12 flex h-full min-w-0 flex-col gap-1.5">
      <FieldLabel htmlFor="editHtml">Mã html</FieldLabel>
      <div className="border-input h-[500px] flex-1 overflow-hidden rounded-md border">
        <Editor
          height="100%"
          defaultLanguage="html"
          value={htmlCode}
          onChange={(value) => onHtmlCodeChange(value ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "var(--font-mono, monospace)",
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            tabSize: 2,
          }}
        />
      </div>
    </Field>
  );
}
