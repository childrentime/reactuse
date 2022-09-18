import { useEffect, useState } from "react";

export default function useMarkdown(filepath: string): string {
  const [content, setContent] = useState<string>("");
  useEffect(() => {
    const getContent = async () => {
      const data = await (await fetch(filepath)).text();
      setContent(data);
    };
    getContent();
  }, [filepath]);
  return content;
}
