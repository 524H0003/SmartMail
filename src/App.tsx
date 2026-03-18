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

interface PlaceholderItem {
  fieldName: string;
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

    const regex = /%={'([^']*)': '([^']*)'}/g;
    const output: PlaceholderItem[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fieldName = match[1],
        defaultValue = match[2];

      output.push({
        fieldName,
        original: match[0],
        defaultValue,
        currentValue:
          savedValues && savedValues[fieldName]
            ? savedValues[fieldName]
            : defaultValue,
      });
    }

    setPlaceholders(output);
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
      updatedHtml = updatedHtml.replace(item.original, item.currentValue);
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

      // 3. Tạo URL Gmail (giữ tiêu đề, bỏ body vì mình sẽ Paste thủ công)
      const subject = encodeURIComponent(
        "Thông báo kết quả cuộc thi Người dẫn chương trình TDTU 2026",
      );
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}`;

      // 4. Mở Gmail
      window.open(gmailUrl, "_blank");
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

  const fields = useMemo(
    () =>
      placeholders.map((item, i) => {
        return (
          <Field>
            <FieldLabel htmlFor={"input-" + i}>{item.fieldName}</FieldLabel>
            <Textarea
              className="resize-y"
              id={"input-" + i}
              placeholder={item.defaultValue.replace(/\s+/g, " ")}
              value={item.currentValue.replace(/\s+/g, " ")}
              onChange={(e) => handleInputChange(i, e.target.value)}
            />
          </Field>
        );
      }),
    [handleInputChange, placeholders],
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
            <FieldGroup>{fields}</FieldGroup>
          </CardContent>
          <CardFooter className="flex justify-between gap-3">
            <Button
              onClick={copyToClipboard}
              className="flex-1"
              variant="outline"
            >
              Gửi HTML
            </Button>
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
