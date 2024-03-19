import { useState, useEffect } from "react";
import { useOrientation } from "../useOrientation";

export const useMobileLandscape = () => {
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [orientation] = useOrientation();

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isMobile = /Mobi|Android｜iphone/i.test(userAgent);
    setIsMobileLandscape(isMobile && orientation.type === "landscape-primary");
  }, [orientation.type]);

  return isMobileLandscape;
}
