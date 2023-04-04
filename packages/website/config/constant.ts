import path from "node:path";

export const development
  = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

export const clientOutput = path.resolve(__dirname, "../public/dist/web");
export const serverOutput = path.resolve(__dirname, "../public/dist/node");
