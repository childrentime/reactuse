import { useWindowsFocus } from "@reactuses/core";

export default () => {
  const focus = useWindowsFocus();
  return (
    <div>
      <p>
        {focus
          ? "💡 Click somewhere outside of the document to unfocus."
          : "ℹ Tab is unfocused"}
      </p>
    </div>
  );
};
