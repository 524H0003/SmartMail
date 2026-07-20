import { Button } from "@/components/ui/button";
import { type Editor, type EditorStateSnapshot } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from "lucide-react";

interface TiptapToolbarProps {
  editor: Editor | null;
}

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
  if (!editor) return null;

  const editorState =
    useEditorState({
      editor,
      selector: (ctx: EditorStateSnapshot<Editor | null>) => ({
        // Text formatting
        isBold: ctx.editor?.isActive("bold") ?? false,
        canBold: ctx.editor?.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor?.isActive("italic") ?? false,
        canItalic: ctx.editor?.can().chain().toggleItalic().run() ?? false,
        isUnderline: ctx.editor?.isActive("underline") ?? false,
        canUnderline:
          ctx.editor?.can().chain().toggleUnderline().run() ?? false,
        isStrike: ctx.editor?.isActive("strike") ?? false,
        canStrike: ctx.editor?.can().chain().toggleStrike().run() ?? false,

        // Text alignment
        isAlignLeft: ctx.editor?.isActive({ textAlign: "left" }) ?? false,
        isAlignCenter: ctx.editor?.isActive({ textAlign: "center" }) ?? false,
        isAlignRight: ctx.editor?.isActive({ textAlign: "right" }) ?? false,
        isAlignJustify: ctx.editor?.isActive({ textAlign: "justify" }) ?? false,
      }),
    }) ?? {};

  if (!editor) return null;

  return (
    <div className="bg-muted flex flex-wrap items-center gap-1 rounded-t-md px-3 py-2">
      {/* Alignment Group */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={
          editorState.isAlignLeft ? "bg-primary text-primary-foreground" : ""
        }
        title="Align Left"
        data-testid="align-left-button"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={
          editorState.isAlignCenter ? "bg-primary text-primary-foreground" : ""
        }
        title="Align Center"
        data-testid="align-center-button"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={
          editorState.isAlignRight ? "bg-primary text-primary-foreground" : ""
        }
        title="Align Right"
        data-testid="align-right-button"
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        className={
          editorState.isAlignJustify ? "bg-primary text-primary-foreground" : ""
        }
        title="Align Justify"
        data-testid="align-justify-button"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      <div className="bg-border mx-1 h-6 w-px" />

      {/* Text Formatting */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editorState.canBold}
        className={
          editorState.isBold ? "bg-primary text-primary-foreground" : ""
        }
        title="Bold (Ctrl+B)"
        data-testid="bold-button"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editorState.canItalic}
        className={
          editorState.isItalic ? "bg-primary text-primary-foreground" : ""
        }
        title="Italic (Ctrl+I)"
        data-testid="italic-button"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editorState.canUnderline}
        className={
          editorState.isUnderline ? "bg-primary text-primary-foreground" : ""
        }
        title="Underline (Ctrl+U)"
        data-testid="underline-button"
      >
        <Underline className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editorState.canStrike}
        className={
          editorState.isStrike ? "bg-primary text-primary-foreground" : ""
        }
        title="Strikethrough"
        data-testid="strike-button"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
    </div>
  );
}
