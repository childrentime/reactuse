import { useEffect, useState } from "react";

export default function useObjectUrl(
  object: Blob | MediaSource | undefined,
): string | undefined {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (object) {
      setUrl(URL.createObjectURL(object));
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object]);

  return url;
}
