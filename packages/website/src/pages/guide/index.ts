import { lazy } from "react";
import type { IMenu, IRoute } from "../../layout";

const getStarted = "getStarted";
const reactPitfall = "reactPitfall";
const exportSize = "exportSize";

export const guideMenu: IMenu[] = [
  {
    title: "Guide",
    items: [
      {
        path: getStarted,
        title: "Get Started",
      },
      {
        path: reactPitfall,
        title: "React Pitfall",
      },
      {
        path: exportSize,
        title: "Export Size",
      },
    ],
  },
];

export const guideRoutes: IRoute[] = [
  {
    path: getStarted,
    element: lazy(() => import("./getStarted.md")),
  },
  {
    path: reactPitfall,
    element: lazy(() => import("./reactPitfall.md")),
  },
  {
    path: exportSize,
    element: lazy(() => import("./exportSize.md")),
  },
];
