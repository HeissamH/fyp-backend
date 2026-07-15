import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "UDSM Connect",
    template: "%s · UDSM Connect",
  },
  description: "UDSM Connect platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
