<p align="center">
<a href="https://github.com/childrentime/reactuse">
  <img src="https://reactuse.com/img/og.png" alt="ReactUse - Collection of essential React Hooks" width="300">
</a>
</p>

<p align="center">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/@reactuses/core?style=for-the-badge&labelColor=24292e">
  <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@reactuses/core?color=50a36f&label=&style=for-the-badge&labelColor=24292e">
  <img alt="UnLicense" src="https://img.shields.io/npm/l/@reactuses/core?style=for-the-badge&labelColor=24292e">
  <img alt="Tree Shaking Friendly" src="https://img.shields.io/badge/Tree%20Shaking-Friendly-brightgreen?style=for-the-badge&labelColor=24292e">
  <img alt="TypeScript Support" src="https://img.shields.io/badge/TypeScript-Support-blue?style=for-the-badge&labelColor=24292e">
</p>

## MCP Support

If you want to use the MCP (Model Context Protocol) integration with reactuse, you can easily set it up with the following configuration. This allows you to run the `@reactuses/mcp` utility via `npx` for enhanced command-line support and automation.

Add the following to your configuration:

```json
"@reactuses/mcp": {
  "command": "npx",
  "args": ["-y", "@reactuses/mcp@latest"],
  "type": "stdio"
}
```

## QuickStart

```tsx harmony
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

Refer to [documentations](https://reactuse.com/) for more details.

---

## Who's Using This

[![PDD](https://img.shields.io/badge/PDD-E_Commerce-orange?style=for-the-badge)](https://www.pinduoduo.com/)
[![Ctrip](https://img.shields.io/badge/Ctrip-Travel-blue?style=for-the-badge)](https://www.ctrip.com/)

---

## Documentation & Live Examples

- [Documentation](https://reactuse.com/)

---

## Feedback

You can submit an [issue](https://github.com/childrentime/reactuse/issues) or provide feedback on [Discord](https://discord.gg/HMsq6cFkKp).

---

## Contribute

See the [**Contributing Guide**](https://github.com/childrentime/reactuse/blob/main/CONTRIBUTING.md)

## ChangeLog

See the [**ChangeLog**](https://github.com/childrentime/reactuse/blob/main/packages/core/changelog.md)

---

## Thanks

This project is heavily inspired by the following awesome projects.

- [streamich/react-use](https://github.com/streamich/react-use)
- [ahooks](https://github.com/alibaba/hooks)
- [vueuse](https://github.com/vueuse/vueuse)

---

## Sponsor Me

If my work has helped you, consider buying me a cup of coffee. Thank you very much🥰!.

[Buy me a coffee](https://www.buymeacoffee.com/lianwenwu)
