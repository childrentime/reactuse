declare module "*.md" {
  const filepath: string;
  export default filepath;
}

declare module "*.ico" {
  const filepath: string;
  export default filepath;
}

declare module "*.module.css" {
  const filepath: { [key: string]: string };
  export default filepath;
}

declare module "*.css" {
  const filepath: string;
  export default filepath;
}

declare module "*.svg" {
  const filepath: string;
  export default filepath;
}

declare module "*.ico" {
  const filepath: string;
  export default filepath;
}

declare module "markdown-it-code-copy";

declare module "website:routes" {
  import { Route } from "../vitePlugins/pluginRoutes";
  interface Menu {
    title: string;
    items: string[];
  }
  const routes: Route[];
  const pages: string[];
  const menuGroup: Menu[];
  export { routes, pages, menuGroup };
}
