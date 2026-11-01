// The app version, linking to its release notes on GitHub.
import { h } from './dom.js';
import { VERSION, BUILD, GUIDE_URL, releaseUrl } from '../data/project.js';

const title = `Release notes for v${VERSION}${BUILD ? ` (build ${BUILD})` : ''}`;
const link = (text) =>
  h('a.version', { href: releaseUrl(), target: '_blank', rel: 'noopener noreferrer', title }, text);

// For the status bar: "v0.1.0".
export const versionLink = () => link(`v${VERSION}`);

// For the welcome screen: "v0.1.0 · Release notes · User guide".
export const versionLine = () =>
  h(
    'p.muted.small.version-line',
    {},
    `v${VERSION} · `,
    link('Release notes'),
    ' · ',
    h('a.version', { href: GUIDE_URL, target: '_blank', rel: 'noopener noreferrer' }, 'User guide'),
  );
