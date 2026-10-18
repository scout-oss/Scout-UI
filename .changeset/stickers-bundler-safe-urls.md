---
"@scout-ui/stickers": patch
---

Resolve official artwork URLs through a private ESM module so CRA/CRACO emits
decodable SVG assets instead of SVGR JavaScript. Next and Vite remain supported;
public definitions, asset exports and the React-free runtime contract are
unchanged.
