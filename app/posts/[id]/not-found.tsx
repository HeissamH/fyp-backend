export default function PostNotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>Post not found</h1>
        <p style={{ margin: 0, color: "#94a3b8", maxWidth: 360 }}>
          This link may be invalid, or the post was unpublished or deleted.
        </p>
      </div>
    </main>
  );
}
