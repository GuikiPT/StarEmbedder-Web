// Simple emoji test component
export function EmojiTest() {
  return (
    <div
      style={{
        marginTop: "10px",
        padding: "10px",
        backgroundColor: "#36393f",
        borderRadius: "5px",
      }}
    >
      <strong>Multiple Custom Emojis:</strong>
      <div>
        Multiple custom emojis: 
        should all render!
      </div>
    </div>
  );
}

// Example embed component
export function ExampleEmbed() {
  return (
    <>
      <div style={{ marginTop: "10px" }}>
        <strong>🧠 Code Block Test:</strong>
        <pre
          style={{
            padding: "12px",
            fontSize: 12,
            backgroundColor: "#2f3136",
            fontFamily:
              'ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace',
            borderRadius: "4px",
            border: "1px solid #40444b",
            color: "#dcddde",
            marginTop: "8px",
          }}
        >
          <code>{`function parseMessage(content) {
  return content.replace(/\`test\`/g, 'working');
}`}</code>
        </pre>
        <p style={{ marginTop: "8px" }}>
          And inline code:{" "}
          <code
            style={{
              backgroundColor: "#2f3136",
              padding: "2px 4px",
              borderRadius: "3px",
            }}
          >
            console.log(&apos;hello&apos;)
          </code>{" "}
          still works!
        </p>
      </div>
    </>
  );
}
