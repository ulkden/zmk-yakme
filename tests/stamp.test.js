import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { stampJs, stampCss, stampHtml, stampFile, stampBuild } from '../scripts/stamp.js';

const V = '0.1.0+abc1234';
const Q = '?v=0.1.0%2Babc1234';

describe('deploy cache-busting stamps', () => {
  test('stampJs versions relative imports and re-exports only', () => {
    const src = [
      "import { a } from './a.js';",
      "import * as b from '../core/b.js';",
      "import './side.js';",
      'export { c } from "./c.js";',
      "import x from 'node:test';",
      "const s = 'from ./not-an-import.js';",
    ].join('\n');
    assert.equal(
      stampJs(src, V),
      [
        `import { a } from './a.js${Q}';`,
        `import * as b from '../core/b.js${Q}';`,
        `import './side.js${Q}';`,
        `export { c } from "./c.js${Q}";`,
        "import x from 'node:test';",
        "const s = 'from ./not-an-import.js';",
      ].join('\n'),
    );
  });

  test('stampCss versions local url() references', () => {
    const src = "src: url('../fonts/a.woff2') format('woff2'); background: url(https://x.test/a.png); b: url(data:x)";
    assert.equal(
      stampCss(src, V),
      `src: url('../fonts/a.woff2${Q}') format('woff2'); background: url(https://x.test/a.png); b: url(data:x)`,
    );
  });

  test('stampHtml versions local script and stylesheet links', () => {
    const src =
      '<link rel="stylesheet" href="css/app.css">\n<script type="module" src="src/main.js"></script>\n<link rel="preconnect" href="https://api.github.com">';
    assert.equal(
      stampHtml(src, V),
      `<link rel="stylesheet" href="css/app.css${Q}">\n<script type="module" src="src/main.js${Q}"></script>\n<link rel="preconnect" href="https://api.github.com">`,
    );
  });

  test('stampFile picks the stamper by extension and leaves other files alone', () => {
    assert.equal(stampFile('a.js', "import './b.js';", V), `import './b.js${Q}';`);
    assert.equal(stampFile('LICENSE', "import './b.js';", V), "import './b.js';");
  });

  test('stampBuild fills in the deployed commit and fails loudly if the marker moved', () => {
    const src = "export const VERSION = '0.1.0';\nexport const BUILD = '';\n";
    assert.equal(stampBuild(src, 'abc1234'), 'export const VERSION = \'0.1.0\';\nexport const BUILD = "abc1234";\n');
    assert.throws(() => stampBuild("export const BUILD = 'x';", 'abc1234'), /not found/);
  });
});
