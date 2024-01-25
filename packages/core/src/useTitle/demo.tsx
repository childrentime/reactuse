import { useState } from "react";
import { useTitle } from "@reactuses/core";

export default () => {
  const [title, setTitle] = useState("title");

  useTitle(title);

  return (
    <div>
      <button onClick={() => setTitle("newTitle")}>Change Title</button>
    </div>
  );
};
