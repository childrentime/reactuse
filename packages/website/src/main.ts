import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes";

export const createRoot = ViteReactSSG(
  { routes },
  () => { },
  {
    rootContainer: "#main",
  },
);
