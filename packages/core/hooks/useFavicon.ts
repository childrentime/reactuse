import { useEffect } from "react";

export default function useFavicon(
  href: string,
  baseUrl = "",
  rel = "icon",
): void {
  useEffect(() => {
    const url = `${baseUrl}${href}`;
    const element = document.head.querySelectorAll<HTMLLinkElement>(
      `link[rel*="${rel}"]`,
    );

    element.forEach(el => (el.href = url));
    if (element.length === 0) {
      const link: HTMLLinkElement = document.createElement("link");
      link.rel = rel;
      link.href = url;
      document.getElementsByTagName("head")[0].appendChild(link);
    }
  }, [baseUrl, href, rel]);
}
