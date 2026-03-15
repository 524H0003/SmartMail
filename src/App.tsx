import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router";

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
      placeholders.map((item, i) => (
        <div key={i} style={{ marginBottom: "15px", padding: "0px 20px" }}>
          <label
            style={{
              display: "block",
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            {item.fieldName}
          </label>
          <textarea
            rows={7}
            value={item.currentValue.replace(/\s+/g, " ")}
            onChange={(e) => handleInputChange(i, e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              boxSizing: "border-box",
              resize: "vertical",
              overflowY: "hidden",
            }}
          />
        </div>
      )),
    [handleInputChange, placeholders],
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
