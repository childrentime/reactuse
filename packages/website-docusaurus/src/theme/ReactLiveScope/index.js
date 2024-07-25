import React from "react";
import * as ReactUse from "@reactuses/core";
import { useQRCode } from "@reactuses/core/useQRCode";
// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  ...ReactUse,
  useQRCode,
};
export default ReactLiveScope;
