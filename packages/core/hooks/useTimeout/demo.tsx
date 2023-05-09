import { useTimeout } from "@reactuses/core";

export default () => {
  const [isPending, start, cancel] = useTimeout(5000);

  return (
    <div>
      <div>Pending: {JSON.stringify(isPending)}</div>
      <button
        onClick={() => {
          start();
        }}
      >
        Start Again
      </button>
      <button
        onClick={() => {
          cancel();
        }}
      >
        Cancel
      </button>
    </div>
  );
};
