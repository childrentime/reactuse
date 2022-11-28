import Header from "./pages/header";
import Main from "./pages/main";
import { ToastContainer } from "react-toastify";
import { Route, Routes } from "react-router-dom";
import Index from "./pages/index";
import "./main.css";
import "highlight.js/styles/stackoverflow-light.css";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          // 增加一个自执行的函数
          __html: `
        (function () {
          function setTheme(newTheme) {
            window.__theme = newTheme;
            if (newTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else if (newTheme === 'light') {
              document.documentElement.classList.remove('dark');
            }
          }
          var preferredTheme;
          try {
            preferredTheme = localStorage.getItem('theme');
          } catch (err) { }
          window.__setPreferredTheme = function(newTheme) {
            preferredTheme = newTheme;
            setTheme(newTheme);
            try {
              localStorage.setItem('theme', newTheme);
            } catch (err) { }
          };
          var initialTheme = preferredTheme;
          var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
          if (!initialTheme) {
            initialTheme = darkQuery.matches ? 'dark' : 'light';
          }
          setTheme(initialTheme);
          darkQuery.addEventListener('change', function (e) {
            if (!preferredTheme) {
              setTheme(e.matches ? 'dark' : 'light');
            }
          });
        })();
      `,
        }}
      />
      <Header />
      <Routes>
        <Route path={"/"} element={<Index />} key="main page" />
        <Route
          path={"*"}
          element={
            <>
              <Main />
            </>
          }
        />
      </Routes>

      <ToastContainer />
    </>
  );
}

export default App;
