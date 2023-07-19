import type { PropsWithChildren } from "react";

export default function Document(
  props: PropsWithChildren<{ assets: string[] }>,
) {
  const { children, assets } = props;

  const Assest = assets
    .filter((asset) => {
      const fileType = asset.slice(asset.lastIndexOf(".") + 1);
      if (fileType === "js") {
        return false;
      }
      return true;
    })
    .map((asset) => {
      const fileType = asset.slice(asset.lastIndexOf(".") + 1);
      switch (fileType) {
        case "svg":
          return (
            <link
              rel="preload"
              type="image/svg+xml"
              href={asset}
              key={asset}
              as="image"
            />
          );
        case "png":
          return (
            <link
              rel="preload"
              type="image/png"
              href={asset}
              key={asset}
              as="image"
            />
          );
        case "ico":
          return (
            <link
              rel="icon"
              type="image/x-icon"
              href={asset}
              key={asset}
            />
          );
        case "css":
          return (
            <link
              rel="stylesheet"
              type="text/css"
              href={asset}
              key={asset}
            />
          );

        default:
          return <link href={asset} key={asset} />;
      }
    });

  return (
    <html lang="en">
      <head>
        <title>ReactUse Docs</title>
        <meta
          name="google-site-verification"
          content="cYSXMQh7Yfm6rW16yR-5_x0jmMX_ABwMDwAoPPlPc1M"
        />
        <meta name="msvalidate.01" content="FCAB31FC7E191890AC6C3BC3A945596A" />
        <meta name="baidu-site-verification" content="code-WMH1e8oKID" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reactuse.com/" />
        <meta property="og:title" content="ReactUse Docs" />
        <meta
          property="og:description"
          content="Collection of essential React Hooks Utilities."
        />
        <meta charSet="UTF-8" />
        <meta name="keywords" content="reactuse,react" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="description"
          content="Collection of essential React Hooks Utilities."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        {Assest}
      </head>
      <body>
        <div id="main">{children}</div>
      </body>
    </html>
  );
}
