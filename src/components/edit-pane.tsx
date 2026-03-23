import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Eye, Share } from "lucide-react";
import { FieldGroup } from "./ui/field";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  copyShareUrl,
  decodeData,
  type PlaceholderItem,
  type TypeValue,
} from "@/lib/utils";
import { Field, FieldLabel } from "./ui/field";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  useSidebar,
} from "./ui/sidebar";

export interface EditPaneProps {
  onMailHtmlChange: (mailHtml: string) => void;
  mailTemplate: string;
}

export default function EditPane({
  onMailHtmlChange,
  mailTemplate,
}: EditPaneProps) {
  const [mailHtml, setMailHtml] = useState(""),
    [placeholders, setPlaceholders] = useState<PlaceholderItem[]>([]),
    { toggleSidebar } = useSidebar();

  const parsePlaceholders = useCallback((text: string) => {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("ph") || params.get("data");
    const savedValues = encodedData ? decodeData(encodedData) : null;

    const regex = /%={([^|]+)\|([^|]*)\|([^|]*)\|(\d+)}/g;

    const resultMap = new Map<string, PlaceholderItem>();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fieldName = match[1],
        tag = match[2],
        defaultValue = match[3],
        colSpan = Number(match[4]) || 12;

      if (!resultMap.has(fieldName)) {
        let type: TypeValue = "multi";
        if (tag === "1") type = "single";

        resultMap.set(fieldName, {
          fieldName,
          type,
          colSpan,
          original: match[0],
          defaultValue,
          currentValue: savedValues?.[fieldName] ?? defaultValue,
        });
      }
    }

    setPlaceholders(Array.from(resultMap.values()));
  }, []);

  const copyToClipboard = async () => {
    try {
      const blob = new Blob([mailHtml], { type: "text/html" });

      const data = [
        new ClipboardItem({
          "text/html": blob,
          "text/plain": new Blob([mailHtml], { type: "text/plain" }),
        }),
      ];

      await navigator.clipboard.write(data);
    } catch (err) {
      console.error("Lỗi khi copy Rich Text: ", err);
      navigator.clipboard.writeText(mailHtml);
      alert(
        "Trình duyệt không hỗ trợ copy Rich Text, đã chuyển sang copy code HTML thuần.",
      );
    }
  };

  const handleInputChange = useCallback(
    (i: number, newValue: string) => {
      const output = Array.from(placeholders);
      output[i].currentValue = newValue;
      setPlaceholders(output);
    },
    [placeholders],
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
      index: number,
    ) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      const key = e.key.toLowerCase();
      const tagMap: Record<string, string> = {
        b: "strong",
        i: "em",
        u: "u",
      };

      const tag = tagMap[key];
      if (!tag) return; // Nếu không phải b, i, u thì bỏ qua

      e.preventDefault();

      const target = e.currentTarget;
      const { selectionStart: start, selectionEnd: end, value } = target;

      if (!start || !end) return;

      // Lấy đoạn text đang bôi đen
      const selectedText = value.substring(start, end);

      // Tạo nội dung mới
      const openTag = `<${tag}>`;
      const closeTag = `</${tag}>`;

      const newValue =
        value.substring(0, start) +
        openTag +
        selectedText +
        closeTag +
        value.substring(end);

      // Cập nhật state thông qua hàm handleInputChange của bạn
      handleInputChange(index, newValue);

      // Đặt lại vị trí con trỏ sau khi React render xong
      requestAnimationFrame(() => {
        target.focus();
        target.setSelectionRange(start + openTag.length, end + openTag.length);
      });
    },
    [handleInputChange],
  );

  const fields = useMemo(
    () =>
      placeholders.map((item, i) => {
        type AcceptElements = HTMLInputElement | HTMLTextAreaElement;

        const commonProps = {
          id: `input-${i}`,
          placeholder: item.defaultValue.replace(/\s+/g, " "),
          value: item.currentValue.replace(/\s+/g, " "),
          onChange: (e: React.ChangeEvent<AcceptElements>) =>
            handleInputChange(i, e.target.value),
          onKeyDown: (e: React.KeyboardEvent<AcceptElements>) =>
            handleKeyDown(e, i),
        };

        return (
          <Field className={`col-span-${item.colSpan} justify-between`} key={i}>
            <FieldLabel htmlFor={"input-" + i}>{item.fieldName}</FieldLabel>
            {item.type == "single" && <Input {...commonProps} />}
            {item.type == "multi" && (
              <Textarea className="resize-y" {...commonProps} />
            )}
          </Field>
        );
      }),
    [handleInputChange, handleKeyDown, placeholders],
  );

  useEffect(() => {
    let updatedHtml = mailTemplate;
    Object.values(placeholders).forEach((item) => {
      updatedHtml = updatedHtml.replaceAll(item.original, item.currentValue);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMailHtml(updatedHtml);

    onMailHtmlChange(updatedHtml);
  }, [placeholders, mailTemplate, onMailHtmlChange]);

  useEffect(
    // eslint-disable-next-line react-hooks/set-state-in-effect
    () => parsePlaceholders(mailTemplate),
    [mailTemplate, parsePlaceholders],
  );

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between flex-row">
        <h1 className="text-lg font-semibold">Chỉnh sửa nội dung</h1>
        <SidebarMenuButton asChild>
          <Button className="md:hidden w-fit" onClick={toggleSidebar}>
            <Eye className="mr-2 size-4" />
            Xem trước
          </Button>
        </SidebarMenuButton>
      </SidebarHeader>
      <CardContent className="overflow-y-auto">
        <FieldGroup className="grid gap-4">
          {fields}
        </FieldGroup>
      </CardContent>
      <SidebarFooter className="flex flex-row">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              onClick={copyToClipboard}
              className="flex-1"
              variant="outline"
            >
              Sao chép nội dung email
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Đã sao chép nội dung vào clipboard
              </AlertDialogTitle>
              <AlertDialogDescription>
                Vui lòng mở email và dán nội dung
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction variant="default" size="default">
                Tiếp tục
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          size="icon"
          aria-label="Submit"
          onClick={() => copyShareUrl({ placeholders })}
        >
          <Share />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
