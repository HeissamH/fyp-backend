"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <p style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      Loading API documentation…
    </p>
  ),
});

export default function ApiDocsPage() {
  return (
    <div style={{ margin: 0, minHeight: "100vh" }}>
      <SwaggerUI
        url="/api/openapi"
        docExpansion="list"
        defaultModelExpandDepth={4}
        defaultModelsExpandDepth={3}
        persistAuthorization
        tryItOutEnabled
      />
    </div>
  );
}
