---
title: Unit testing Node CLIs
date: '2024-04-19'
---

We have a Node CLI at work using [yargs](https://www.npmjs.com/package/yargs) that I wanted to write some unit tests for. Here's what I got working - it does not take any user input, but does run the CLI and write to the filesystem successfully. The pieces are:

Mocking the filesystem by creating `__mocks__/fs.js` and `__mocks__/fs/promises.js` that replace `fs` with `memfs`:

```js
// fs.js
const {fs} = require('memfs');
module.exports = fs;

// promises.js
const {fs} = require('memfs');
module.exports = fs.promises;
```

Creating a test that calls `jest.mock` on `fs` and also mocks out `fetch` (in this case we're using node-fetch):

```js
jest.mock('fs');
jest.mock('fs/promises');
const {vol} = require('memfs');

// mock all fetch calls
jest.mock('node-fetch', () => require('fetch-mock').sandbox());
const fetchMock = require('node-fetch');
```

Running the command by setting `process.argv`:

```js
const cli = require('./cli');

function runCommand(command) {
  // the first two args don't matter, but it sends the correct number of CLI args
  process.argv = ['node', 'cli.js', ...command.split(' ')];
  return cli();
}
```

And then we can run a unit test using Jest:

```js
describe('test the cli', () => {
  let originalArgv;

  beforeEach(() => {
    // wipe mock filesystem
    vol.fromJSON({}, '/');
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
    fetchMock.reset();
  });

  it('inits with expected files', async () => {
    fetchMock.get('example.com', getMockResponse());

    await runCommand('do-thing --arg true');

    // for easy comparison, parse JSON file contents
    const files = vol.toJSON();
    for (const file of Object.keys(files)) {
      if (file.endsWith('.json')) {
        files[file] = JSON.parse(files[file]);
      }
    }

    expect(files).toEqual({
      '/test.json': {
        numbers: [1, 2, 3, 4]
      },
      '/other.txt': 'text file contents'
    });
  });
});
```

Here are some of the resources I used or want to reference later:

- [package to mock stdin](https://www.npmjs.com/package/mock-stdin) and [article using it](https://medium.com/@altshort/unit-testing-node-cli-apps-with-jest-2cd4adc599fb)
- using memfs as a mock fs: [Testing filesystem in Node.js: The easy way](https://medium.com/nerd-for-tech/testing-in-node-js-easy-way-to-mock-filesystem-883b9f822ea4)
- [cli-testing-library](https://github.com/gmrchk/cli-testing-library) and the associated [Smashing Mag article](https://www.smashingmagazine.com/2022/04/testing-cli-way-people-use-it/)
- [How to Test a Node.js Command-Line Tool](https://javascript.plainenglish.io/how-to-test-a-node-js-command-line-tool-2735ea7dc041)
- [How to Test Yargs CLI with Jest](https://kgajera.com/blog/how-to-test-yargs-cli-with-jest/)
