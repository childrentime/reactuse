import { useMousePressed } from "@reactuses/core";

export default () => {
  const [mouse, type] = useMousePressed();

  return (
    <div>
      <p>Pressed: {JSON.stringify(mouse)}</p>
      <p>SourceType: {JSON.stringify(type)}</p>
    </div>
  );
};
