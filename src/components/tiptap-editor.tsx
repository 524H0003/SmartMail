import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";

import { TiptapToolbar } from "./tiptap-toolbar";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML().replace(/<p><\/p>/g, "<p><br></p>"));
    },
  });

  return (
    <div className="min-h-[150px] rounded-md border">
      <TiptapToolbar editor={editor} />
      <div className="rounded-b-md border-t">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
