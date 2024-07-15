---
sidebar_position: 1
slug: /
---

# 起步

Reactuse 是一个全面的自定义 React Hooks 集合，旨在增强您的功能组件！ 您可以轻松释放 React Hooks 的全部潜力，并利用其强大功能来创建可重用且高效的代码。

## 安装

```shell
npm i @reactuses/core
```

## 用例

```tsx
import { useToggle } from '@reactuses/core'

function Demo() {
  const [on, toggle] = useToggle(true)

  return (
    <div>
      <div>{on ? 'ON' : 'OFF'}</div>
      <button onClick={toggle}>Toggle</button>
      <button onClick={() => toggle(true)}>set ON</button>
      <button onClick={() => toggle(false)}>set OFF</button>
    </div>
  )
}
```
