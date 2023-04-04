import type { ReactElement } from "react";

const Layout = (props: { file: string; children: ReactElement }) => {
  const { file } = props;
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: file }} />
      {props.children}
    </div>
  );
};

export default Layout;
