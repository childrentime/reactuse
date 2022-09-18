# useMarkdown

React state hook that get the content in the markdown file.

## Usage

First, define the typescript type of markdown.

```ts
declare module "*.md" {
  const filepath: string;
  export default filepath;
}
```

Prepare a markdown file

```md
# demo

## demo1

## demo2

## demo3
```

and import it into your component

```tsx
import demo from "./demo.md";

const Demo = () => {
  const demoContent = useMarkdown(demo);
  // maybe you can render it with using markdownit
  const demoMarkdown = markdown.render(demoContent);

  return <div dangerouslySetInnerHTML={{ __html: demoMarkdown }} />;
};
```

## Type Declarations

```ts
useMarkdown(filepath: string): string
```

## Examples
