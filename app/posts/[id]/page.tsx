import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  excerpt,
  getPublicPost,
  siteBaseUrl,
} from "@/lib/share/public-post";
import { OpenInApp } from "@/components/share/OpenInApp";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPost(id);
  if (!post) {
    return {
      title: "Post not found · UDSM Connect",
      description: "This post is unavailable or has been removed.",
    };
  }

  const title = post.title?.trim() || "UDSM Connect post";
  const description = excerpt(post.content);
  const url = `${siteBaseUrl()}/posts/${post.id}`;

  return {
    title: `${title} · UDSM Connect`,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "UDSM Connect",
      ...(post.imageUrl
        ? { images: [{ url: post.imageUrl, alt: title }] }
        : {}),
    },
    twitter: {
      card: post.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(post.imageUrl ? { images: [post.imageUrl] } : {}),
    },
    // Hint to Android that this URL is associated with the app
    other: {
      "al:android:url": url,
      "al:android:package": "tz.ac.udsm.udsm_connect",
      "al:android:app_name": "UDSM Connect",
    },
  };
}

export default async function PublicPostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPublicPost(id);
  if (!post) notFound();

  const title = post.title?.trim() || "Campus update";
  const base = siteBaseUrl();
  const pageUrl = `${base}/posts/${post.id}`;

  const published =
    post.publishedAt != null
      ? new Date(post.publishedAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0b1f3a 0%, #102a4c 40%, #0f172a 100%)",
        color: "#f8fafc",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        padding: "24px 16px 48px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <header style={{ marginBottom: 24, textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#93c5fd",
              fontWeight: 600,
            }}
          >
            UDSM Connect
          </p>
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 14 }}>
            Shared campus post
          </p>
        </header>

        <article
          style={{
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          }}
        >
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt={title}
              style={{
                width: "100%",
                maxHeight: 320,
                objectFit: "cover",
                borderRadius: 12,
                marginBottom: 16,
              }}
            />
          ) : null}

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 24,
              lineHeight: 1.25,
              fontWeight: 700,
            }}
          >
            {title}
          </h1>

          <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: 14 }}>
            {post.authorName ? `By ${post.authorName}` : "UDSM Connect"}
            {published ? ` · ${published}` : ""}
          </p>

          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              fontSize: 16,
              color: "#e2e8f0",
            }}
          >
            {post.content}
          </div>
        </article>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <OpenInApp postId={post.id} pageUrl={pageUrl} />
          <p
            style={{
              margin: 0,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            If the app is installed, this link should open the post there.
            Otherwise you can read the full post on this page.
          </p>
        </div>
      </div>
    </main>
  );
}
