import { Fragment, useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import styles from "./style.module.css";
import NotFound from "../404/";
import { menuGroup, pages } from "../../routes";
import { useScrollIntoView } from "@reactuses/core";

const Main = () => {
  const pathname = useLocation().pathname.substring(1);

  const [element, setElement] = useState<Element | null>(null);
  const { scrollIntoView } = useScrollIntoView<HTMLDivElement>({
    offset: 60,
    targetElement: element,
    duration: 0,
  });
  useEffect(() => {
    const node = document.getElementsByClassName(styles.itemSelect)[0];
    if (!node) {
      return;
    }
    setElement(node);
  }, [pathname]);

  useEffect(() => {
    scrollIntoView({ alignment: "center" });
  }, [element]);

  return (
    <div className={styles.main}>
      <div className={styles.row}>
        <div className={styles.col5}>
          <div>
            <section className={styles.menu}>
              <ul className={styles.menuRoot}>
                {menuGroup.map((menu) => {
                  return (
                    <Fragment key={menu.title}>
                      <div className={styles.itemTitle} title={menu.title}>
                        {menu.title}
                      </div>
                      {menu.items.map((item) => {
                        return (
                          <li
                            key={item}
                            className={`${styles.item} ${
                              pathname === item ? styles.itemSelect : ""
                            }`}
                          >
                            <Link to={`/${item}`} className={styles.itemLink}>
                              {item}
                            </Link>
                          </li>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
        <div className={styles.col19}>
          <section className={styles.content}>
            <Routes>
              {pages.map((page) => (
                <Route
                  path={`/${page.page}`}
                  element={<page.component />}
                  key={page.page}
                />
              ))}
              <Route path={"*"} element={<NotFound />} key="404" />
            </Routes>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Main;
