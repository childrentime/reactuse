import { useLocationSelector } from "@reactuses/core";
import { useEffect, useRef } from "react";

function CurrentPathname() {
  const pathname = useLocationSelector(location => location.pathname);
  const ref = useRef(0);

  useEffect(() => {
    ref.current = ref.current + 1;
  });
  return (
    <div>
      {pathname}
      <div>renderCount: {ref.current}</div>
    </div>
  );
}

function CurrentHash() {
  const hash = useLocationSelector(location => location.hash || "nohash");
  const ref = useRef(0);

  useEffect(() => {
    ref.current = ref.current + 1;
  });
  return (
    <div>
      {hash}
      <div>hashRender: {ref.current}</div>
    </div>
  );
}

function Links() {
  return (
    <div>
      <a href="#link1">#link1</a>
      <a href="#link2">#link2</a>
      <a href="#link3">#link3</a>
    </div>
  );
}

export default function Demo() {
  return (
    <div>
      <CurrentPathname />
      <CurrentHash />
      <Links />
    </div>
  );
}
