import type { RouteRecord } from "vite-react-ssg";
import { routes as coreRoutes } from "website:routes";
import Index from "./pages/index";
import { guideMenu, guideRoutes } from "./pages/guide";
import Layout from "./layout";
import BaseLayout from "./layout/BaseLayout";
import { mainMenus } from "./constant";

export const routes: RouteRecord[] = [
  {
    path: "/",
    Component: BaseLayout,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "core",
        element: <Layout menuGroup={mainMenus} />,
        children: coreRoutes.map((page) => {
          return {
            path: `${page.path}`,
            Component: page.element,
          };
        }),
      },
      {
        path: "guide",
        element: <Layout menuGroup={guideMenu} />,
        children: guideRoutes.map((page) => {
          return {
            path: `${page.path}`,
            Component: page.element,
          };
        }),
      },
    ],
  },
];
