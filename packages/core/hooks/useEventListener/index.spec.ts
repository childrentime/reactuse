import { act, renderHook } from "@testing-library/react";
import useEventListener from ".";

interface Props {
  name: string;
  handler: (...args: any[]) => void;
  target: any;
  options?: any;
}

const propsList1: Props[] = [
  {
    name: "name1",
    handler: () => void 0,
    target: {
      current: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        name: "target1",
      },
    },
  },
  {
    name: "name2",
    handler: () => void 0,
    target: {
      current: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        name: "target2",
      },
    },
  },
];

describe(useEventListener, () => {
  it("should call addEventListener/removeEventListener on mount/unmount", () => {
    checkOnMountAndUnmount(
      propsList1[0],
      "addEventListener",
      "removeEventListener",
    );
  });

  it("should call addEventListener/removeEventListener on deps changes", () => {
    checkOnDepsChanges(
      propsList1[0],
      propsList1[1],
      "addEventListener",
      "removeEventListener",
    );
  });
});

function checkOnMountAndUnmount(
  props: Props,
  addEventListenerName: string,
  removeEventListenerName: string,
) {
  const { unmount } = renderHook(
    (p: Props) => useEventListener(p.name, p.handler, p.target, p.options),
    {
      initialProps: props,
    },
  );
  expect(props.target.current[addEventListenerName]).toHaveBeenCalledTimes(1);
  unmount();
  expect(props.target.current[removeEventListenerName]).toHaveBeenCalledTimes(
    1,
  );
}

function checkOnDepsChanges(
  props1: Props,
  props2: Props,
  addEventListenerName: string,
  removeEventListenerName: string,
) {
  const { rerender } = renderHook(
    (p: Props) => useEventListener(p.name, p.handler, p.target, p.options),
    {
      initialProps: props1,
    },
  );
  expect(props1.target.current[addEventListenerName]).toHaveBeenCalledTimes(1);

  // deps are same as previous
  rerender({
    name: props1.name,
    handler: props1.handler,
    target: props1.target,
    options: props1.options,
  });
  expect(props1.target.current[removeEventListenerName]).not.toHaveBeenCalled();

  // name is different from previous
  rerender({
    name: props2.name,
    handler: props1.handler,
    target: props1.target,
    options: props1.options,
  });
  expect(props1.target.current[removeEventListenerName]).toHaveBeenCalledTimes(
    1,
  );
  expect(props1.target.current[addEventListenerName]).toHaveBeenCalledTimes(2);

  // options contents is same as previous
  rerender({
    name: props2.name,
    handler: props2.handler,
    target: props1.target,
    options: { a: "opt1" },
  });
  expect(props1.target.current[removeEventListenerName]).toHaveBeenCalledTimes(
    2,
  );

  // options is different from previous
  rerender({
    name: props2.name,
    handler: props2.handler,
    target: props1.target,
    options: props2.options,
  });
  expect(props1.target.current[removeEventListenerName]).toHaveBeenCalledTimes(
    3,
  );

  // target is different from previous
  act(() => {
    rerender({
      name: props2.name,
      handler: props2.handler,
      target: props2.target,
      options: props2.options,
    });
  });

  expect(props1.target.current[removeEventListenerName]).toHaveBeenCalledTimes(
    4,
  );
  expect(props2.target.current[addEventListenerName]).toHaveBeenCalledTimes(1);
}
