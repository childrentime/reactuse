import path from "node:path";

export const development
  = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

export const clientWebOutput = path.resolve(__dirname, "../public/dist/web");
export const serverWebOutput = path.resolve(__dirname, "../public/dist/node");
export const serverOutput = path.resolve(__dirname, "../common-server");
