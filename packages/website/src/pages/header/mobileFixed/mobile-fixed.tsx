import { useDarkMode } from "@reactuses/core";
import { GoMarkGithub } from "react-icons/go";
import { FaDiscord } from "react-icons/fa";
import sun from "../../../assets/sun.svg";
import moon from "../../../assets/moon.svg";
import { guideMenu } from "../../guide";
import { mainMenus } from "../../../constant";
import styles from "./mobile-fixed.module.css";
import Menu from "./menu";

interface IProps {
  show: boolean;
  toggleShow: () => void;
}
const MobileFixed = (props: IProps) => {
  const { show, toggleShow } = props;
  const [dark, toggleDark] = useDarkMode({
    classNameDark: "dark",
    classNameLight: "light",
  });

  if (!show) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <nav className={styles.menus}>
          <Menu
            title="Guide"
            menuGroup={guideMenu}
            prefix="guide"
            toggleShow={toggleShow}
          />
          <Menu
            title="Core"
            menuGroup={mainMenus}
            prefix="core"
            toggleShow={toggleShow}
          />
          <div className={styles.icons}>
            <a
              href="https://github.com/childrentime/reactuse"
              target="_blank"
              className={`${styles.icon} ${styles.github}`}
              rel="noreferrer"
            >
              <GoMarkGithub />
            </a>
            <a
              href="https://discord.gg/WzDtCCFF"
              target="_blank"
              className={`${styles.icon} ${styles.discord}`}
              rel="noreferrer"
            >
              <FaDiscord />
            </a>
            <button onClick={toggleDark} className={styles.darkmode}>
              {dark && (
                <img
                  alt="darkmode"
                  src={moon}
                  width={20}
                  height={20}
                />
              )}
              {!dark && (
                <img
                  alt="darkmode"
                  src={sun}
                  width={20}
                  height={20}
                />
              )}
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MobileFixed;
