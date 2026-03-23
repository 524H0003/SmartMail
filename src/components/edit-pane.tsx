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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Copy } from "lucide-react";
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

export interface EditPaneProps {
  onMailHtmlChange: (mailHtml: string) => void;
  mailTemplate: string;
}

export default function EditPane({
  onMailHtmlChange,
  mailTemplate,
}: EditPaneProps) {
  const [mailHtml, setMailHtml] = useState(""),
    [placeholders, setPlaceholders] = useState<PlaceholderItem[]>([]);

  const parsePlaceholders = useCallback((text: string) => {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("ph");
    const savedValues = encodedData ? decodeData(encodedData) : null;

    const regex = /%={'([^']*)':(.)'([^']*)'(.?)}/g;

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
          <Field className={`col-span-${item.colSpan}`} key={i}>
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
    <Card
      className={`size-full rounded-none border-t border-r-0 border-t-black border-r-black lg:border-t-0 lg:border-r`}
    >
      <CardHeader>
        <CardTitle>Chỉnh sửa nội dung</CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto">
        <FieldGroup className="grid gap-4">{fields}</FieldGroup>
      </CardContent>
      <CardFooter className="flex justify-between gap-3">
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
          <Copy />
        </Button>
      </CardFooter>
    </Card>
  );
}
