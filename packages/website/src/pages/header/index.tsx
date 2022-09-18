import { Link } from "react-router-dom";
import styles from "./style.module.css";
import logo from "../../assets/logo.svg";
import moon from "../../assets/moon.svg";
import sun from "../../assets/sun.svg";
import { useDarkMode } from "@reactuses/core";
import { GoMarkGithub } from "react-icons/go";

type ColorMode = "dark" | "";
const Header = () => {
  const [dark, setDark] = useDarkMode<ColorMode>();
  const toggleDark = () => {
    if (dark === "dark") {
      setDark("");
    } else {
      setDark("dark");
    }
  };
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <div className={styles.col5}>
          <h1>
            <Link to={"/"} className={styles.logo}>
              <img src={logo} alt="logo" />
              reactuses
            </Link>
          </h1>
        </div>
        <div className={styles.col19}>
          <div className={styles.metas}>
            <a
              href="https://github.com/childrentime/reactuse"
              target="_blank"
              className={styles.icon}
              rel="noreferrer"
            >
              <GoMarkGithub />
            </a>
            <button onClick={toggleDark} className={styles.darkmode}>
              {dark && <img alt="darkmode" src={moon} width={20} height={20} />}
              {!dark && <img alt="darkmode" src={sun} width={20} height={20} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
