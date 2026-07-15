'use client';

import { useEffect, useState } from 'react';

type Props = {
  postId: string;
  pageUrl: string;
  packageName?: string;
};

/**
 * Tries to hand off https://…/posts/:id into the installed Android app.
 * Uses https App Links intent first, then custom scheme fallback.
 */
export function OpenInApp({
  postId,
  pageUrl,
  packageName = 'tz.ac.udsm.udsm_connect',
}: Props) {
  const [status, setStatus] = useState<'idle' | 'trying' | 'fallback'>('idle');

  const httpsHost = (() => {
    try {
      return new URL(pageUrl).host;
    } catch {
      return 'www.udsminfo.com';
    }
  })();

  // Official App Links intent (works when app is installed; falls back to pageUrl)
  const httpsIntent =
    `intent://${httpsHost}/posts/${postId}` +
    `#Intent;scheme=https;package=${packageName};` +
    `S.browser_fallback_url=${encodeURIComponent(pageUrl)};end`;

  // Custom scheme (works even before Digital Asset Links verify).
  // Host + path mirror https so Flutter GoRouter still sees /posts/:id
  const customScheme = `udsmconnect://${httpsHost}/posts/${postId}`;
  const customIntent =
    `intent://${httpsHost}/posts/${postId}` +
    `#Intent;scheme=udsmconnect;package=${packageName};` +
    `S.browser_fallback_url=${encodeURIComponent(pageUrl)};end`;

  const tryOpenApp = () => {
    setStatus('trying');
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isAndroid = /Android/i.test(ua);

    if (isAndroid) {
      // Prefer verified https App Link intent
      window.location.href = httpsIntent;
      // If still visible after a moment, try custom scheme
      window.setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.location.href = customIntent;
        }
      }, 700);
      window.setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setStatus('fallback');
        }
      }, 1800);
      return;
    }

    // iOS / desktop: try custom scheme (iOS needs Universal Links for seamless open)
    window.location.href = customScheme;
    window.setTimeout(() => setStatus('fallback'), 1200);
  };

  // Auto-attempt open on Android when the share page loads
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (!/Android/i.test(navigator.userAgent)) return;
    // Small delay so OG crawlers don't get stuck; humans get the handoff
    const t = window.setTimeout(() => tryOpenApp(), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, pageUrl]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button
        type="button"
        onClick={tryOpenApp}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '14px 18px',
          borderRadius: 12,
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        {status === 'trying' ? 'Opening app…' : 'Open in UDSM Connect app'}
      </button>
      <a
        href={customScheme}
        style={{
          display: 'block',
          textAlign: 'center',
          color: '#93c5fd',
          fontSize: 14,
          textDecoration: 'underline',
        }}
      >
        Or open with app link
      </a>
      {status === 'fallback' && (
        <p
          style={{
            margin: 0,
            textAlign: 'center',
            color: '#fbbf24',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Couldn&apos;t open the app automatically. Install UDSM Connect, then
          tap the button again — or keep reading on this page.
        </p>
      )}
    </div>
  );
}
