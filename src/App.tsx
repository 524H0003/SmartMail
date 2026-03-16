import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
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

interface PlaceholderItem {
  fieldName: string;
  original: string;
  defaultValue: string;
  currentValue: string;
}

function App() {
  const [placeholders, setPlaceholders] = useState<PlaceholderItem[]>([]);

  function parsePlaceholders(text: string) {
    const regex = /%={'([^']*)': '([^']*)'}/g,
      output: PlaceholderItem[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      output.push({
        fieldName: match[1],
        original: match[0],
        defaultValue: match[2],
        currentValue: match[2],
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewHtml);
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
          <CardFooter>
            <Button
              onClick={copyToClipboard}
              className="w-full"
              variant="outline"
            >
              Copy HTML
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

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      {/* Sidebar: Các ô nhập liệu */}
      <div
        style={{
          width: "350px",
          borderRight: "1px solid #ddd",
          overflowY: "auto",
          background: "#f9f9f9",
        }}
      >
        <h3 style={{ padding: "20px" }}>Cài đặt Template</h3>
        {fields}
        <button
          onClick={copyToClipboard}
          style={{
            width: "100%",
            padding: "20px",
            background: "#007bff",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "4px",
            fontWeight: "bold",
            position: "sticky",
            bottom: 0,
            margin: "10px 0px 0px 0px",
          }}
        >
          Copy HTML kết quả
        </button>
      </div>

      <div
        style={{
          flex: 1,
          background: "#eee",
          display: "flex",
          justifyContent: "center",
          overflowY: "scroll",
        }}
      >
        <div
          style={{ width: "100%" }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </div>
  );
}

export default App;
