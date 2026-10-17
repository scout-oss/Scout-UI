# M19 dependency advisories found on 17 October 2026

Base: `f74c235397fc7a1163b55f4deda79d91e7bf9175`. Branch:
`m19-release-blockers-integration` (PR #22).

The braces repair and the CodeQL check-then-read repair left two remaining
findings. Rechecking current advisory data then showed more. GitHub's
dependency-graph comparison for the PR, the same data Dependency Review uses,
reported vulnerable packages that the PR adds. Fresh `pnpm audit` runs of the
root workspace and of the generated CRA consumer agreed. Most of these
advisories were published or reviewed after the 3 October checks, so the earlier
green audit is not current evidence. No advisory is suppressed, no severity
threshold changes, and neither lockfile is excluded from review.

## Root workspace

| Package       | Was    | Now    | Advisory                                    | Paths                                           |
| ------------- | ------ | ------ | ------------------------------------------- | ----------------------------------------------- |
| next          | 16.3.6 | 16.3.8 | HIGH GHSA-cjq9-62q9-8jv4, 4 moderate, 1 low | apps/docs, fixtures/next-app                    |
| sharp         | 0.35.4 | 0.35.5 | HIGH GHSA-wq5f-xc86-pv6w (librsvg)          | root devDependency, optional dependency of next |
| source-map-js | 1.2.1  | 1.2.2  | HIGH GHSA-68fv-2mgg-jv7q                    | postcss, css-tree, magicast                     |

Next 16.3.6 itself came from this PR's earlier security repair, so Dependency
Review counts it as added. The exact pins move to 16.3.8. The existing sharp
override now targets 0.35.5 for both 0.35.3 and 0.35.4 requests, and
`source-map-js@1.2.1` has an exact override to 1.2.2. The lockfile changes only
next and @next/\*, sharp and @img/\* (including libvips 1.3.4), and
source-map-js. fdir now shares the existing picomatch 4.0.7. Each release was
public for more than two weeks.

### Remaining root advisories: 8 moderate, 0 high, 0 critical

| Package                 | Version | Advisory            | Fix available | Path (private tooling only)                |
| ----------------------- | ------- | ------------------- | ------------- | ------------------------------------------ |
| colord                  | 2.9.3   | GHSA-2wm5-q62r-hmrv | 2.9.4         | stylelint                                  |
| vitest                  | 4.1.10  | GHSA-82fw-gwwq-j7x9 | 4.1.11        | root test runner, @vitest/coverage-v8      |
| @vitest/mocker          | 4.1.10  | GHSA-82fw-gwwq-j7x9 | 4.1.11        | vitest                                     |
| fast-uri                | 3.1.7   | GHSA-hrr3-gc8f-f4qj | 3.1.8         | ajv 8 through table                        |
| brace-expansion         | 1.1.20  | GHSA-q2hr-2g5m-vwhr | 1.1.21        | minimatch 3 through ESLint and its plugins |
| brace-expansion         | 5.0.11  | GHSA-q2hr-2g5m-vwhr | 5.0.12        | minimatch 10                               |
| sprintf-js              | 1.0.3   | GHSA-hp3w-g68c-fv3c | none          | argparse 1 through js-yaml 3               |
| postcss-selector-parser | 7.1.5   | GHSA-rj75-hqrm-r3gf | 7.1.6         | stylelint and its @csstools helpers        |

All eight are denial-of-service or file-read issues in development tooling. None
is a dependency of a public package, and none runs during docs requests. They do
not meet the high-severity gate. They are recorded here for a separate,
explicitly approved maintenance change, not hidden.

## Separately locked CRA fixture

`tooling/fixtures/cra-consumer/pnpm-lock.yaml` is new in this PR, so Dependency
Review reviews the whole graph. React Scripts 5.0.1 is unmaintained, so the
remedies are exact overrides of patched releases or removal of code the fixture
never runs. Its compatibility purpose is unchanged: React 19.0.0, React Scripts
5.0.1, CRACO 7.1.0, Tailwind 3.4.17 and an empty CRACO configuration.

| Package                | Was           | Remedy                                          | Advisory                     |
| ---------------------- | ------------- | ----------------------------------------------- | ---------------------------- |
| braces / micromatch    | 3.0.3 / 4.0.8 | private glob adapter (see braces document)      | HIGH GHSA-vfj7-8cjw-p6xm     |
| shell-quote            | 1.10.0        | override 1.11.0                                 | CRITICAL GHSA-pqg4-j6r4-53mv |
| postcss                | 8.5.10        | direct pin 8.5.28                               | HIGH x2                      |
| postcss                | 7.0.39        | override 8.5.28 (resolve-url-loader, Sass only) | HIGH x2                      |
| react-router(-dom)     | 7.15.0        | direct pin 7.18.4                               | HIGH x2                      |
| serialize-javascript   | 4.0.0 / 6.0.2 | override 7.1.2 (CommonJS, Node >=20)            | HIGH GHSA-5c6j-r48x-rmvq     |
| underscore             | 1.13.6        | override 1.13.8                                 | HIGH GHSA-qpx9-hpmf-5gmw     |
| source-map-js          | 1.2.1         | override 1.2.2                                  | HIGH GHSA-68fv-2mgg-jv7q     |
| svgo / nth-check       | 1.3.2 / 1.0.2 | @svgr/webpack 5.5.0 -> 6.5.1 (svgo 2.8.4)       | HIGH x3                      |
| node-forge             | 1.4.0         | removed with webpack-dev-server; no patch       | HIGH GHSA-86w9-cpqp-85rv     |
| webpack-dev-middleware | 5.3.4         | removed with webpack-dev-server                 | HIGH GHSA-g84c-rxfj-3j2c     |

React Scripts 5 pulls svgo 1.3.2 and nth-check 1.0.2 only through @svgr/webpack
5.5.0, and neither has a patched 1.x release. SVGR 6.5.1 accepts the same loader
options CRA passes (`svgo: false`, `svgoConfig`, `titleProp`, `ref`) and uses
svgo 2.8.4, css-select 4 and nth-check 2.1.1. The CRA runner's direct SVG import
still goes through CRA's SVGR and file-loader chain and must return decodable
SVG. The fixture does not exercise the named `ReactComponent` export.

node-forge has no patched release, and every sync selfsigned release depends on
it. selfsigned 5 drops node-forge but is async-only, which webpack-dev-server 4
cannot call. The fixture runs only `craco build`, so its workspace removes the
webpack-dev-server dependency and stops auto-installing optional peers.
`@pmmmwh/react-refresh-webpack-plugin` otherwise re-adds the dev server as an
optional peer. This removes exactly the dev-server subtree. TypeScript 4.9.5,
previously an auto-installed peer of CRACO's config loader, ts-node and
fork-ts-checker, is declared explicitly so the graph keeps it.
`pnpm peers check` reports no issues. The CRA runner fails if any removed or
vulnerable package directory is installed.

Fresh `pnpm audit` of the generated consumer: 0 critical, 0 high, 2 moderate, 1
low. sprintf-js 1.0.3 (GHSA-hp3w-g68c-fv3c) comes through js-yaml 3 in Jest's
coverage tooling. postcss-selector-parser 6.1.4 (GHSA-rj75-hqrm-r3gf) comes
through cssnano 5 and stylehacks. @tootallnate/once 1.1.2 (GHSA-vpq2-c234-7xj6,
low) comes through jsdom in Jest's environment. They are below the high gate and
are recorded for the same separate maintenance decision.

## Remote gates still required

Local results do not establish merge readiness. The updated PR #22 head needs
fresh CI, Browser, Linux Visual, Security, Dependency Review and the separate
CodeQL alert check. M18 and M19 remain open.
