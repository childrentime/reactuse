import { useEffect, useState } from "react";

export default function ClientRender(props: any) {
  const [isMount, setIsMount] = useState(false);

  useEffect(() => {
    setIsMount(true);
  }, []);

  return isMount ? props.children : null;
}
