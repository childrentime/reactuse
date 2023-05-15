# useCookie

React hook that facilitates the storage, updating and deletion of values within the CookieStore.

## Usage

```tsx
import { useCookie } from "@reactuses/core";

export default () => {
  const [cookieValue, updateCookie, refreshCookie] = useCookie("cookie-key", {
    path: "/",
    defaultValue: "default-value",
  });

  const updateButtonClick = () => {
    updateCookie("new-cookie-value");
  };

  const deleteButtonClick = () => {
    updateCookie(undefined);
  };

  const change = () => {
    const store = (window as any).cookieStore;
    store.set({ name: "cookie-key", value: "changed" });
  };

  return (
    <div>
      <p>
        Click on the button to update or clear the cookie
      </p>
      <p color="blue">
        cookie: {cookieValue || "no value"}
      </p>
      <button onClick={updateButtonClick}>
        Update the cookie
      </button>
      <button onClick={deleteButtonClick}>
        Clear the cookie
      </button>
      <button onClick={change}>
        Changing the cookie through other methods
      </button>
      <button onClick={refreshCookie}>
        Refresh the cookie
      </button>
    </div>
  );
};
```
