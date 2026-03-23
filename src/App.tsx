function App({ previewHtml }: { previewHtml: string }) {
  return (
    <div
      style={{ width: "100%" }}
      dangerouslySetInnerHTML={{ __html: previewHtml }}
    />
  );
}

export default App;
