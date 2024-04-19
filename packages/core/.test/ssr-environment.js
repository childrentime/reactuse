
const NodeEnvironment = require('jest-environment-node').TestEnvironment;
const JSDOMEnvironment = require('jest-environment-jsdom').TestEnvironment;

/**
 * Test environment for testing integration of react-dom (browser) with react-dom/server (node)
 */
class ReactDOMServerIntegrationEnvironment extends NodeEnvironment {
  domEnvironment;
  constructor(config, context) {
    super(config, context);

    this.domEnvironment = new JSDOMEnvironment(config, context);
    this.global.window = this.domEnvironment.dom.window;
    this.global.document = this.global.window.document;
    this.global.navigator = this.global.window.navigator;
    this.global.Node = this.global.window.Node;
    this.global.addEventListener = this.global.window.addEventListener;
    this.global.MutationObserver = this.global.window.MutationObserver;
  }

  async setup() {
    await super.setup();
    await this.domEnvironment.setup();
  }

  async teardown() {
    await this.domEnvironment.teardown();
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = ReactDOMServerIntegrationEnvironment;
