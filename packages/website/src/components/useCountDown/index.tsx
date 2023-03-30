import { useCountDown } from "@reactuses/core";
import ClientRender from "../../../utils/ClientRender";
import Layout from "../Layout";
import file from "./README.md";

const Page = () => {
  return (
    <Layout file={file}>
      <ClientRender>
        <Demo />
      </ClientRender>
    </Layout>
  );
};

export default Page;

const Demo = () => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diffInSec = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

  // note: If your app is running in server side, must pass the same time as the client
  // this demo is not running in server side
  const [hour, minute, second] = useCountDown(diffInSec);
  return <div>{`${hour}:${minute}:${second}`}</div>;
};
