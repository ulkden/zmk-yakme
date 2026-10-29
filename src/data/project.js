// Project metadata.
export const REPO_URL = 'https://github.com/ulkden/zmk-yakme';
export const ISSUES_URL = `${REPO_URL}/issues/new`;
export const GUIDE_URL = `${REPO_URL}/blob/main/docs/guide/README.md`;

// The released version (SemVer), kept equal to package.json's (a unit test checks).
export const VERSION = '0.1.0';
// The commit the deployed site was built from; scripts/build-site.mjs fills it in, '' in development.
export const BUILD = '';

export const releaseUrl = (version = VERSION) => `${REPO_URL}/releases/tag/v${version}`;
