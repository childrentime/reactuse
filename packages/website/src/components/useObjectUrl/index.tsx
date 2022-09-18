import { useObjectUrl } from "@reactuses/core";
import { ChangeEvent, useState } from "react";
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
  const [file, setFile] = useState<File>();
  const url = useObjectUrl(file);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const files = target.files;
    setFile(files && files.length > 0 ? files[0] : undefined);
  };
  return (
    <div>
      <p>Select File</p>
      <input type="file" onChange={onFileChange} />
      <p>Object Url</p>
      <div>{url}</div>
    </div>
  );
};
