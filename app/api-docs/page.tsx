"use client";

import { useEffect, useState } from "react";
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
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    fetch("/api/openapi")
      .then((res) => res.json())
      .then(setSpec)
      .catch(console.error);
  }, []);

  if (!spec) {
    return (
      <p style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
        Loading API specification…
      </p>
    );
  }

  return (
    <div style={{ margin: 0, minHeight: "100vh" }}>
      <SwaggerUI
        spec={spec}
        docExpansion="list"
        defaultModelExpandDepth={4}
        defaultModelsExpandDepth={3}
        persistAuthorization
        tryItOutEnabled
      />
    </div>
  );
}
