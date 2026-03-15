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
      const res = await fetch(`/templates/${pathname}.html`),
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
        <div key={i} style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            {item.fieldName}
          </label>
          <input
            type="text"
            value={item.currentValue}
            onChange={(e) => handleInputChange(i, e.target.value)}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>
      )),
    [handleInputChange, placeholders],
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* Sidebar: Các ô nhập liệu */}
      <div
        style={{
          width: "350px",
          padding: "20px",
          borderRight: "1px solid #ddd",
          overflowY: "auto",
          background: "#f9f9f9",
        }}
      >
        <h3>Cài đặt Template</h3>
        {fields}
        <button
          onClick={copyToClipboard}
          style={{
            width: "100%",
            padding: "12px",
            background: "#007bff",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          Copy HTML kết quả
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: "40px",
          background: "#eee",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "600px",
            background: "white",
            padding: "10px",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ textAlign: "center", color: "#888" }}>
            Xem trước Email
          </h4>
          <hr />
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </div>
    </div>
  );
}

export default App;
