# Security Policy

## Supported versions

Scout UI has not published a supported release. Until the first public alpha,
security fixes apply to the default branch only. This table will be updated when
packages are released.

| Version                   | Supported |
| ------------------------- | --------- |
| Unreleased default branch | Yes       |
| Published packages        | None yet  |

## Reporting a vulnerability

Do not disclose a suspected vulnerability in a public issue. Use GitHub's
private vulnerability reporting feature for this repository when available. If
it is unavailable, contact a maintainer privately using the contact method on
their GitHub profile.

Include the affected package or documentation route, reproduction steps, impact,
and any known workaround. Maintainers will acknowledge receipt, assess severity,
and coordinate disclosure. No response-time guarantee is offered before a
staffed security rotation exists.

Likely risk areas include unsafe SVG content, share-URL decoding, generated text
escaping, dependency compromise, clipboard assumptions, and release credentials.
