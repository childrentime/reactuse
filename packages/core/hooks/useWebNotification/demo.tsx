import useWebNotification from ".";

export default function Demo() {
  const { isSupported, show, close }
    = useWebNotification(true);
  return (
    <div>
      <p>Supported: {JSON.stringify(isSupported)}</p>
      {isSupported
        ? (
          <div>
            <button
              onClick={() => {
                show("Hello, world from ReactUse!");
              }}
            >
              Show Notification
            </button>
            <button onClick={close}>Close</button>
          </div>
          )
        : (
          <div>The Notification Web API is not supported in your browser.</div>
          )}
    </div>
  );
}
