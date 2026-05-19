import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web document shell — ensures the root can fill the viewport so nested
 * ScrollViews and flex layouts scroll correctly on desktop browsers.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
              }
              body {
                margin: 0;
                overflow: auto;
                -webkit-overflow-scrolling: touch;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
