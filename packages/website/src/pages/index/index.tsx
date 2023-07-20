import { startTransition } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";

const Page = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.layout}>
      <h1>React Use</h1>
      <p>Collection of Essential React Hooks Utilities</p>
      <div className={styles.buttons}>
        <div
          className={`${styles.primary} ${styles.button}`}
          onClick={() => {
            startTransition(() => {
              navigate("/guide/getStarted");
            });
          }}
        >
          Get Started
        </div>
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
