import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router";
import { ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable";
import { Field, FieldGroup, FieldLabel } from "./components/ui/field";
import { Textarea } from "./components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Copy } from "lucide-react";
import { decodeData, encodeData } from "./lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog";
import { Input } from "./components/ui/input";

type TypeValue = "multi" | "single";

interface PlaceholderItem {
  fieldName: string;
  type: TypeValue;
  colSpan: number;
  original: string;
  defaultValue: string;
  currentValue: string;
}

function App() {
  const [placeholders, setPlaceholders] = useState<PlaceholderItem[]>([]);

  function parsePlaceholders(text: string) {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("data");
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
  }

  const [templateRaw, setTemplateRaw] = useState(""),
    [previewHtml, setPreviewHtml] = useState(""),
    { pathname } = useLocation();

  useEffect(() => {
    const exec = async () => {
      const res = await fetch(`./templates/${pathname.split("/")[2]}.html`),
        text = await res.text();

      setTemplateRaw(text);
      parsePlaceholders(text);
    };
    exec();
  }, [pathname]);

  useEffect(() => {
    let updatedHtml = templateRaw;
    Object.values(placeholders).forEach((item) => {
      updatedHtml = updatedHtml.replaceAll(item.original, item.currentValue);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewHtml(updatedHtml);
  }, [placeholders, templateRaw]);

  const handleInputChange = useCallback(
    (i: number, newValue: string) => {
      const output = Array.from(placeholders);
      output[i].currentValue = newValue;
      setPlaceholders(output);
    },
    [placeholders],
  );

  const copyToClipboard = async () => {
    try {
      // 1. Tạo "Blob" chứa nội dung HTML để trình duyệt hiểu đây là định dạng Rich Text
      const blob = new Blob([previewHtml], { type: "text/html" });

      // 2. Sử dụng ClipboardItem để copy cả định dạng HTML và Plain Text (dự phòng)
      const data = [
        new ClipboardItem({
          "text/html": blob,
          "text/plain": new Blob([previewHtml], { type: "text/plain" }),
        }),
      ];

      await navigator.clipboard.write(data);
    } catch (err) {
      console.error("Lỗi khi copy Rich Text: ", err);
      // Dự phòng nếu trình duyệt cũ không hỗ trợ ClipboardItem
      navigator.clipboard.writeText(previewHtml);
      alert(
        "Trình duyệt không hỗ trợ copy Rich Text, đã chuyển sang copy code HTML thuần.",
      );
    }

    // navigator.clipboard.writeText(previewHtml);
  };

  const copyShareUrl = () => {
    const dataToSave = placeholders.reduce(
      (acc, item) => {
        if (item.currentValue !== item.defaultValue) {
          acc[item.fieldName] = item.currentValue;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const url = new URL(window.location.href);

    if (Object.keys(dataToSave).length > 0) {
      const encoded = encodeData(dataToSave);
      url.searchParams.set("data", encoded);
    } else {
      url.searchParams.delete("data");
    }

    navigator.clipboard.writeText(url.toString());
  };

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
    [handleInputChange], // Chỉ cần handleInputChange nếu nó là một stable function (từ dispatch hoặc useCallback)
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

  return (
    <ResizablePanelGroup className="flex-col-reverse! lg:flex-row!">
      <ResizablePanel minSize="40%">
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
            <Button size="icon" aria-label="Submit" onClick={copyShareUrl}>
              <Copy />
            </Button>
          </CardFooter>
        </Card>
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
