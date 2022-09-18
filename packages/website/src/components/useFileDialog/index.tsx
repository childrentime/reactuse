import { useFileDialog } from "@reactuses/core";
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
  const [files, open, reset] = useFileDialog();

  return (
    <div>
      <button onClick={() => open()}> Choose files</button>
      <button
        style={{ marginLeft: 20 }}
        disabled={!files}
        onClick={() => {
          reset();
        }}
      >
        Reset
      </button>
      {files && (
        <div>
          <p>
            You have selected: <b>{files.length} files</b>
            {Array.from(files).map((file) => {
              return <li key={file.name}>{file.name}</li>;
            })}
          </p>
        </div>
      )}
    </div>
  );
};
