import Header from "./pages/header";
import Main from "./pages/main";
import { ToastContainer } from "react-toastify";
import { Route, Routes } from "react-router-dom";
import Index from "./pages/index";

function App() {
  return (
    <>
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
