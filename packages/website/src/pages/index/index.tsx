import { Link } from "react-router-dom";
import styles from "./style.module.css";

const Page = () => {
  return (
    <div className={styles.layout}>
      <h1>React Use</h1>
      <p>Collection of Essential React Hooks Utilities</p>
      <div className={styles.shell}>
        <span>npm i @reactuses/core</span>
      </div>
      <div className={styles.buttons}>
        <Link
          className={`${styles.primary} ${styles.button}`}
          to={"/useToggle"}
        >
          Get Started
        </Link>
        <a
          href="https://github.com/childrentime/reactuse"
          target="_blank"
          className={styles.button}
          rel="noreferrer"
        >
          View On Github
        </a>
      </div>
    </div>
  );
};

export default Page;
