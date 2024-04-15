---
sidebar_position: 1
slug: /
---

# Get Started

Reactuse is a comprehensive collection of custom React Hooks designed to supercharge your functional components! you can easily unlock the full potential of React Hooks and leverage their power to create reusable and efficient code.

## Installation

```shell
npm i @reactuses/core
```

## Usage Example

```tsx
import { useToggle } from "@reactuses/core";

const Demo = () => {
  const [on, toggle] = useToggle(true);

  return (
    <div>
      <div>{on ? "ON" : "OFF"}</div>
      <button onClick={toggle}>Toggle</button>
      <button onClick={() => toggle(true)}>set ON</button>
      <button onClick={() => toggle(false)}>set OFF</button>
    </div>
  );
};
```
