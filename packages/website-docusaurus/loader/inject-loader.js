const path = require("node:path");
const fs = require("node:fs");

function injectLoader(content) {
  const component = path.parse(this.resourcePath).name;
  const newContent = content.replace(
    /%%API%%/g,
    getAPI(component),
  );
  return newContent;
}

function getAPI(component) {
  const pathname = path.resolve(__dirname, `../api/${component}-README.md`);
  if (!fs.existsSync(pathname)) {
    console.log("pathname not exsit", pathname);
    return "";
  }
  return `## API\n\nimport API from \'${pathname}\'\n\n<API />`;
}

module.exports = injectLoader;
