import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML().replace(/<p><\/p>/g, "<p><br></p>"));
    },
  });

  return (
    <div className="min-h-[150px] rounded-md border p-2">
      <EditorContent editor={editor} />
    </div>
  );
}