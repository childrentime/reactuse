import { useToggle } from "@reactuses/core";
import { Fragment, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import type { IMenu } from "../../../layout";
import styles from "./menu.module.css";

interface IProps {
  title: string;
  menuGroup: IMenu[];
  prefix: string;
  toggleShow: () => void;
}

const Menu = (props: IProps) => {
  const { title, menuGroup, prefix, toggleShow } = props;
  const [open, toggle] = useToggle(false);
  const navigate = useNavigate();

  return (
    <div className={`${styles.menuGroup} ${open ? styles.menuGroupOpen : ""}`}>
      <button className={styles.menuButton} onClick={toggle}>
        {title}
      </button>
      <div className={`${styles.items} ${open ? styles.itemOpen : ""}`}>
        <div className={styles.group}>
          {menuGroup.map((group) => {
            const { title, items } = group;
            return (
              <Fragment key={title}>
                <p className={styles.title}>{title}</p>
                {items.map(item => (
                  <button
                    className={styles.link}
                    key={item.path}
                    onClick={() => {
                      startTransition(() => {
                        toggleShow();
                        navigate(`${prefix}/${item.path}`);
                      });
                    }}
                  >
                    {item.title}
                  </button>
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Menu;
