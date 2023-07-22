export const getHookTemplate = (
  demoPath: string,
  originHtml: string,
  demoHtml: string,
  typeDeclarationsHtml: string,
) => {
  return `
  import Demo from '${demoPath}';
  function Layout() {
    return <div className="prose">
      <div dangerouslySetInnerHTML={{__html: ${originHtml}}} />
      <h2>Usage</h2>
      <div dangerouslySetInnerHTML={{__html: ${demoHtml}}} />
      <div>
        <h2>Example</h2>
        <div className="demo-container">
          <Demo />
        </div>
      </div>
      <div dangerouslySetInnerHTML={{__html: ${typeDeclarationsHtml}}} />
    </div>
  }
  `;
};

export const getNormalTemplate = (
  html: string,
) => {
  return `
  function Layout() {
    return <div>
      <div dangerouslySetInnerHTML={{__html: ${html}}} />
    </div>
  }
  `;
};
