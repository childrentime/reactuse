import routesJSON from "./routes.json";

interface Menu {
  title: string;
  items: string[];
}

export const menuGroup: Menu[] = routesJSON.main;

export const routes = menuGroup.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);
