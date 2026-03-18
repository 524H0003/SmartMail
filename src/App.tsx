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
          <CardFooter className="flex justify-between gap-3">
            <Button
              onClick={copyToClipboard}
              className="flex-1"
              variant="outline"
            >
              Copy HTML
            </Button>
            <Button size="icon" aria-label="Submit">
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
