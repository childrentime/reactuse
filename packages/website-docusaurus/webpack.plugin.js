// @ts-check

const path = require('node:path')
/** @typedef {import('@docusaurus/types').Plugin} Plugin */

const docsDir = path.resolve(__dirname, 'docs')

/** @type {() => Promise<Plugin>} */
async function webpackPlugin() {
  return {
    name: 'docusaurus-webpack-plugin',

    configureWebpack(config, isServer, utils, content) {
      // @ts-expect-error ignore
      const targetRule = config.module.rules.find(rule => path.resolve(rule?.include?.[1] ?? '') === docsDir)
      // @ts-expect-error ignore
      targetRule.use.push('./loader/inject-loader.js')

      return {
        plugins: [],
      }
    },
  }
}

module.exports = webpackPlugin
