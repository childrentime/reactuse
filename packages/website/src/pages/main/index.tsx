import { Fragment } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import styles from "./style.module.css";
import NotFound from "../404/";
import { menuGroup, pages } from "../../routes";

const Main = () => {
  const pathname = useLocation().pathname.substring(1);

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
