const path = require('path');
const { generateMarkdown } = require('../lib');

const schema = generateMarkdown(path.resolve(__dirname, 'a.tsx'), {
  sourceFilesPaths: ['**/*.ts', '**/*.tsx'],
  strictOrder: true,
});

console.log(schema);
