import Layout from "../Layout";
import file from "./README.md";
import { useDarkMode } from "@reactuses/core";

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;

const Demo = () => {
  const [theme, setTheme] = useDarkMode<"light" | "dark">({
    initialValue: "light",
  });

  const toggleDark = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };
  return (
    <div>
      <div>theme: {theme}</div>
      <br />
      <div>
        <button onClick={toggleDark}>toggleDark</button>
      </div>
    </div>
  );
};
