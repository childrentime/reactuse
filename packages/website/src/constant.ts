import { menuGroup } from "website:routes";
import type { IMenu } from "./layout";

export const mainMenus: IMenu[] = menuGroup.map((menus) => {
  const { title } = menus;
  const items = menus.items.slice().map((item) => {
    return {
      path: item,
      title: item,
    };
  });

  return {
    title,
    items,
  };
});
