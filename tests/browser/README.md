# Browser test contract

The browser matrix covers Chromium, Firefox, WebKit, desktop, tablet, mobile,
reduced motion, coarse pointer, and forced colors. Touch, pointer, motion, and
forced-color projects use Playwright emulation; release candidates still need
manual checks on representative physical devices and assistive technology.

On failure Playwright retains a screenshot, trace, and video under
`.artifacts/playwright/test-results`. Accessibility violations and captured
browser errors are attached to the failing test result.
