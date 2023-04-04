import { Link, useNavigate } from "react-router-dom";
import { useClickOutside, useDarkMode } from "@reactuses/core";
import { GoMarkGithub } from "react-icons/go";
import { useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { FiSearch } from "react-icons/fi";
import { ToastContainer } from "react-toastify";
import { routes } from "../../routes";
import sun from "../../assets/sun.svg";
import moon from "../../assets/moon.svg";
import logo from "../../assets/logo.svg";
import styles from "./style.module.css";

const Header = () => {
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode({
    classNameDark: "dark",
    classNameLight: "light",
  });

  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, () => {
    setOpen(false);
  });

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && e.metaKey) {
        setOpen(open => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className={styles.header}>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        className={styles.dialog}
        ref={modalRef}
      >
        <Command.Input autoFocus placeholder="Search for apis..." />
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>
          {routes.map(item => (
            <Command.Item
              key={item}
              value={item}
              onSelect={() => {
                setOpen(false);
                navigate(`/${item}`);
              }}
            >
              {item}
            </Command.Item>
          ))}
        </Command.List>
      </Command.Dialog>
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
          <div className={styles.search} onClick={() => setOpen(true)}>
            <button className={styles.searchButton}>
              <span className={styles.buttonContainer}>
                <svg
                  className={styles.searchIcon}
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="2669"
                  fill="currentColor"
                >
                  <path
                    className={styles.searchIconPath}
                    d="M685.6 660.336l155.152 155.168a16 16 0 0 1 0 22.624l-11.312 11.328a16 16 0 0 1-22.624 0l-158.528-158.544a289.792 289.792 0 0 1-165.152 51.36C322.336 742.256 192 611.904 192 451.12 192 290.336 322.336 160 483.136 160c160.784 0 291.12 130.336 291.12 291.136 0 82.112-33.984 156.272-88.672 209.2z m-202.464 33.92c134.272 0 243.12-108.848 243.12-243.12C726.256 316.848 617.408 208 483.136 208 348.848 208 240 316.848 240 451.136c0 134.272 108.848 243.12 243.136 243.12z"
                    p-id="2670"
                  >
                  </path>
                </svg>
                <span className={styles.placeHolder}>Search</span>
              </span>
              <span className={styles.buttonKeys}>
                <kbd className={styles.buttonKeyLeft}>⌘</kbd>
                <kbd className={styles.buttonKeyRight}>K</kbd>
              </span>
            </button>
          </div>
          <div className={styles.metas}>
            <a
              onClick={(e) => {
                e.preventDefault();
                setOpen(open => !open);
              }}
              className={`${styles.icon} ${styles.searchMobile}`}
            >
              <FiSearch />
            </a>
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
      <ToastContainer theme={dark ? "dark" : "light"} />
    </header>
  );
};

export default Header;
