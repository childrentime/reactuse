import { useObjectUrl } from "@reactuses/core";
import type { ChangeEvent } from "react";
import { useState } from "react";

export default () => {
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
