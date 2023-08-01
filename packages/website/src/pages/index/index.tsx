import { Link } from "vite-react-ssg";
import styles from "./style.module.css";

const Page = () => {
  return (
    <div className={styles.layout}>
      <h1>React Use</h1>
      <p>Collection of Essential React Hooks Utilities</p>
      <div className={styles.buttons}>
        <Link to="/guide/getStarted">
          <div
            className={`${styles.primary} ${styles.button}`}
          >
            Get Started
          </div>
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
