import Layout from "../Layout";
import file from "./README.md";

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;

const Demo = () => {
  return (
    <div>
      <div>
        <iframe
          src="https://codesandbox.io/embed/dreamy-lehmann-mzg96r?fontsize=14&hidenavigation=1&theme=dark"
          style={{
            width: "100%",
            height: 500,
            border: 0,
            borderRadius: 4,
            overflow: "hidden",
          }}
          title="dreamy-lehmann-mzg96r"
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        >
        </iframe>
      </div>
    </div>
  );
};
