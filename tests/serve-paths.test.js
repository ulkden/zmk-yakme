import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { contentType, directoryRedirect, requestPath } from '../scripts/serve-paths.js';

describe('dev server request mapping', () => {
  test('maps request targets to paths below the served folder', () => {
    assert.equal(requestPath('/'), '');
    assert.equal(requestPath('/index.html'), 'index.html');
    assert.equal(requestPath('/src/ui/app.js'), 'src/ui/app.js');
    assert.equal(requestPath('/tests/'), 'tests');
    assert.equal(requestPath('/a//b/./c.js'), 'a/b/c.js');
  });

  test('ignores query strings and fragments, as the version-stamped site needs', () => {
    assert.equal(requestPath('/src/main.js?v=0.1.0%2Babc1234'), 'src/main.js');
    assert.equal(requestPath('/fonts/x.woff2?v=1#frag'), 'fonts/x.woff2');
  });

  test('decodes percent-encoded names', () => {
    assert.equal(requestPath('/my%20file.keymap'), 'my file.keymap');
  });

  test('refuses anything that could escape the folder or reach hidden files', () => {
    for (const target of [
      '/../package.json',
      '/src/../../secret',
      '/%2e%2e/secret',
      '/src/%2e%2e%2f%2e%2e%2fsecret',
      '/..%5csecret',
      '/a%00.js',
      '/%E0%A4%A',
      '/.git/config',
      '/src/.env',
      'index.html',
      'http://example.com/index.html',
    ]) {
      assert.equal(requestPath(target), null, target);
    }
  });

  test('redirects a folder without its trailing slash, keeping the query, to a local path only', () => {
    assert.equal(directoryRedirect('/tests', 'tests'), '/tests/');
    assert.equal(directoryRedirect('/tests?x=1', 'tests'), '/tests/?x=1');
    assert.equal(directoryRedirect('//example.com', 'example.com'), '/example.com/');
    assert.equal(directoryRedirect('/my%20dir', 'my dir'), '/my%20dir/');
    assert.equal(directoryRedirect('/tests/', 'tests'), null);
    assert.equal(directoryRedirect('/tests/?x=1', 'tests'), null);
    assert.equal(directoryRedirect('/', ''), null);
  });

  test('content types let browsers run modules and load fonts', () => {
    assert.equal(contentType('src/main.js'), 'text/javascript; charset=utf-8');
    assert.equal(contentType('scripts/x.mjs'), 'text/javascript; charset=utf-8');
    assert.equal(contentType('index.html'), 'text/html; charset=utf-8');
    assert.equal(contentType('css/app.css'), 'text/css; charset=utf-8');
    assert.equal(contentType('fonts/JetBrainsMono-400.woff2'), 'font/woff2');
    assert.equal(contentType('docs/shot.PNG'), 'image/png');
    assert.equal(contentType('tests/fixtures/zmk/corne.keymap'), 'text/plain; charset=utf-8');
    assert.equal(contentType('LICENSE'), 'application/octet-stream');
    assert.equal(contentType('archive.tar.gz'), 'application/octet-stream');
  });
});
