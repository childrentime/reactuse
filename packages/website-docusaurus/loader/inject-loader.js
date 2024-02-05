const path = require("node:path");
const fs = require("node:fs");

function injectLoader(content) {
  const component = path.parse(this.resourcePath).name;
  const isChinese = this.resourcePath.includes("zh-Hans");
  const newContent = content.replace(
    /%%API%%/g,
    getAPI(component, isChinese),
  );
  return newContent;
}

function getAPI(component, isChinese) {
  const pathname = path.resolve(__dirname, `../api/${component}-README${isChinese ? "-zhHans" : ""}.md`);
  if (!fs.existsSync(pathname)) {
    return "";
  }
  return `## API\n\nimport API from \'${pathname}\'\n\n<API />`;
}

module.exports = injectLoader;
