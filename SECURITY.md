# Security policy

zmk-yakme runs entirely in your browser. It has no server or accounts and collects no analytics.
Imported files never leave your machine. The only network requests are the ones you trigger yourself
by importing from a GitHub URL or repository, and they only go to GitHub (enforced by a
Content-Security-Policy).

## Supported versions

Only the latest version, published from `main` at https://ulkden.github.io/zmk-yakme/, gets fixes.

## Reporting a vulnerability

Please report privately through
[GitHub's private vulnerability reporting](https://github.com/ulkden/zmk-yakme/security/advisories/new)
(**Security → Report a vulnerability**). Don't open a public issue for security problems.

Include what you did, what happened, and if possible a file (keymap, layout or project) that
reproduces it. This is a small, volunteer-maintained project: expect an acknowledgement within a
week and a fix as soon as practical. You'll be credited in the advisory unless you prefer otherwise.

## In scope

- Script injection or HTML injection from an imported or fetched file (keymap, layout, project, KLE/QMK JSON)
- Requests to hosts other than GitHub, or data leaving the browser without a user action
- Problems in the build and deploy pipeline (GitHub Actions) that could tamper with the published site
