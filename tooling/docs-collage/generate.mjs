/**
 * Generates the docs-only "printed matter" collage stickers used by the
 * kinetic CollageTrail. Original Scout UI artwork (CC0-1.0, Scout UI
 * contributors) authored as SVG here and rasterised once to WebP, because a
 * trail composites up to 48 of them at 200px and filtered SVG would be far too
 * expensive to paint per frame.
 *
 * Every object shares one treatment: paper grain, a die-cut white edge made
 * by dilating the object's alpha, and a soft lifted shadow.
 *
 * Run: node tooling/docs-collage/generate.mjs
 * Output: apps/docs/public/collage/<id>.webp; SVG sources in
 * tooling/docs-collage/source/<id>.svg
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const outDir = path.join(root, "apps/docs/public/collage");
const sourceDir = path.join(root, "tooling/docs-collage/source");

const INK = "#121116";
const PAPER = "#f7f5ef";
const CREAM = "#f3e7cc";
const UV = "#7c2cff";
const ACID = "#d4ff5f";
const CYAN = "#61dbe8";
const PINK = "#ff3d9a";
const COBALT = "#1664ff";
const ORANGE = "#ff7a1a";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";
const HAND = "'Marker Felt', 'Chalkboard SE', 'Comic Sans MS', cursive";

const defs = `
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.07  0 0 0 0 0.06  0 0 0 0 0.05  0 0 0 0.16 0" result="grainAlpha"/>
      <feComposite in="grainAlpha" in2="SourceGraphic" operator="in" result="grainIn"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="grainIn"/></feMerge>
    </filter>
    <filter id="sheen" x="0" y="0" width="100%" height="100%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="soft"/>
      <feSpecularLighting in="soft" surfaceScale="4" specularConstant="0.7" specularExponent="22" lighting-color="#ffffff" result="spec">
        <fePointLight x="40" y="-60" z="260"/>
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
      <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.32" k4="0"/>
    </filter>
    <filter id="cut" x="-25%" y="-25%" width="150%" height="150%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="9" result="dilated"/>
      <feFlood flood-color="#fffdf7"/>
      <feComposite in2="dilated" operator="in" result="border"/>
      <feGaussianBlur in="dilated" stdDeviation="7" result="blur"/>
      <feOffset in="blur" dx="5" dy="9" result="offset"/>
      <feFlood flood-color="#120d18" flood-opacity="0.32"/>
      <feComposite in2="offset" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="border"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="dots" width="9" height="9" patternUnits="userSpaceOnUse">
      <circle cx="4.5" cy="4.5" r="2" fill="${INK}" opacity="0.22"/>
    </pattern>
    <pattern id="dotsLight" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="1.6" fill="#ffffff" opacity="0.35"/>
    </pattern>
    <pattern id="twill" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="3" height="6" fill="#000" opacity="0.12"/>
    </pattern>
    <pattern id="airmail" width="56" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <rect width="14" height="20" fill="#d9363b"/>
      <rect x="14" width="14" height="20" fill="${PAPER}"/>
      <rect x="28" width="14" height="20" fill="#1f4fbf"/>
      <rect x="42" width="14" height="20" fill="${PAPER}"/>
    </pattern>
    <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8a6416"/>
      <stop offset="0.22" stop-color="#ffe9a3"/>
      <stop offset="0.42" stop-color="#c8962a"/>
      <stop offset="0.6" stop-color="#fff4c9"/>
      <stop offset="0.8" stop-color="#b07d1c"/>
      <stop offset="1" stop-color="#ffe08a"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CYAN}"/>
      <stop offset="0.7" stop-color="#ffd1e6"/>
      <stop offset="1" stop-color="${PINK}"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#aeb3bd"/>
      <stop offset="0.5" stop-color="#eef0f4"/>
      <stop offset="1" stop-color="#9aa0aa"/>
    </linearGradient>
  </defs>`;

function barcode(x, y, width, height, seed) {
  let bars = "";
  let cursor = x;
  let n = seed;
  while (cursor < x + width) {
    n = (n * 9301 + 49297) % 233280;
    const w = 1.5 + (n % 4) * 1.2;
    bars += `<rect x="${cursor.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${height}" fill="${INK}"/>`;
    cursor += w + 1.6 + ((n >> 3) % 3);
  }
  return bars;
}

function reel(cx, cy) {
  let teeth = "";
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    teeth += `<rect x="${(cx + Math.cos(a) * 13 - 3).toFixed(1)}" y="${(cy + Math.sin(a) * 13 - 3).toFixed(1)}" width="6" height="6" fill="${PAPER}" transform="rotate(${(i * 60).toFixed(0)} ${(cx + Math.cos(a) * 13).toFixed(1)} ${(cy + Math.sin(a) * 13).toFixed(1)})"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="24" fill="${INK}" stroke="${PAPER}" stroke-width="4"/>${teeth}<circle cx="${cx}" cy="${cy}" r="6" fill="${PAPER}"/>`;
}

function starburst(cx, cy, points, outer, inner) {
  let d = "";
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return `${d}Z`;
}

// Letters placed one by one along a circle (librsvg has no textPath support).
function arcText(text, cx, cy, r, fromDeg, toDeg, size, fill, bottom) {
  const letters = [...text];
  return letters
    .map((letter, i) => {
      const t = letters.length === 1 ? 0.5 : i / (letters.length - 1);
      const deg = fromDeg + (toDeg - fromDeg) * t;
      const a = (deg * Math.PI) / 180;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const rot = deg + (bottom ? -90 : 90);
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${SANS}" font-weight="900" font-size="${size}" fill="${fill}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">${letter}</text>`;
    })
    .join("");
}

function perforatedRect(x, y, w, h, r, step) {
  // Stamp edge: a rectangle whose sides are scalloped by evenly spaced bites.
  let holes = "";
  for (let px = x + step / 2; px < x + w; px += step) {
    holes += `<circle cx="${px.toFixed(1)}" cy="${y}" r="${r}"/><circle cx="${px.toFixed(1)}" cy="${y + h}" r="${r}"/>`;
  }
  for (let py = y + step / 2; py < y + h; py += step) {
    holes += `<circle cx="${x}" cy="${py.toFixed(1)}" r="${r}"/><circle cx="${x + w}" cy="${py.toFixed(1)}" r="${r}"/>`;
  }
  return holes;
}

const stickers = {
  "ticket-stub": () => `
    <mask id="m-ticket"><rect width="400" height="400" fill="#fff"/>
      <circle cx="132" cy="122" r="13" fill="#000"/><circle cx="132" cy="278" r="13" fill="#000"/></mask>
    <g transform="rotate(-9 200 200)" mask="url(#m-ticket)">
      <rect x="40" y="122" width="320" height="156" rx="6" fill="${CREAM}"/>
      <rect x="40" y="122" width="92" height="156" rx="6" fill="${ORANGE}"/>
      <rect x="40" y="122" width="92" height="156" fill="url(#dots)"/>
      <line x1="132" y1="136" x2="132" y2="264" stroke="${INK}" stroke-width="2" stroke-dasharray="5 6"/>
      <text x="86" y="200" font-family="${SANS}" font-weight="900" font-size="22" fill="${INK}" text-anchor="middle" transform="rotate(-90 86 200)">Nº 000247</text>
      <text x="152" y="168" font-family="${SANS}" font-weight="900" font-size="40" fill="${INK}" letter-spacing="-1">ADMIT ONE</text>
      <text x="153" y="198" font-family="${SANS}" font-weight="700" font-size="16" fill="${UV}">SCOUT UI — LIVE ON STAGE</text>
      <text x="153" y="228" font-family="${MONO}" font-weight="700" font-size="14" fill="${INK}">ROW α · SEAT 01 · GEN ADM</text>
      <text x="153" y="254" font-family="${MONO}" font-size="12" fill="${INK}" opacity="0.7">NO REFUNDS · UI THAT STICKS</text>
    </g>`,

  mixtape: () => `
    <g transform="rotate(7 200 200)">
      <rect x="50" y="95" width="300" height="200" rx="16" fill="${INK}"/>
      <rect x="66" y="110" width="268" height="118" rx="8" fill="${PAPER}"/>
      <rect x="66" y="110" width="268" height="30" fill="${UV}"/>
      <rect x="66" y="140" width="268" height="12" fill="${ACID}"/>
      <rect x="66" y="152" width="268" height="8" fill="${PINK}"/>
      <text x="80" y="132" font-family="${SANS}" font-weight="900" font-size="19" fill="${PAPER}" letter-spacing="1">STICKER MIXTAPE</text>
      <text x="310" y="133" font-family="${SANS}" font-weight="900" font-size="20" fill="${ACID}">A</text>
      <rect x="120" y="168" width="160" height="50" rx="24" fill="${INK}"/>
      ${reel(150, 193)}${reel(250, 193)}
      <text x="80" y="185" font-family="${HAND}" font-size="16" fill="${INK}" transform="rotate(-4 80 185)">vol.1</text>
      <path d="M110 295 L130 250 H270 L290 295 Z" fill="#2c2932"/>
      <circle cx="150" cy="276" r="7" fill="${PAPER}"/><circle cx="250" cy="276" r="7" fill="${PAPER}"/>
      <text x="200" y="244" font-family="${MONO}" font-size="11" fill="${PAPER}" text-anchor="middle">SIDE A · 90 MIN · UI THAT STICKS</text>
    </g>`,

  "airmail-envelope": () => `
    <g transform="rotate(-5 200 200)">
      <rect x="38" y="92" width="324" height="216" rx="6" fill="url(#airmail)"/>
      <rect x="50" y="104" width="300" height="192" rx="3" fill="#fbf8f0"/>
      <path d="M50 104 L200 214 L350 104" fill="none" stroke="#d8d0bd" stroke-width="3"/>
      <rect x="70" y="122" width="132" height="34" rx="3" fill="#1f4fbf"/>
      <text x="136" y="145" font-family="${SANS}" font-weight="900" font-size="16" fill="#fbf8f0" text-anchor="middle">PAR AVION</text>
      <text x="136" y="172" font-family="${SANS}" font-weight="700" font-size="11" fill="#1f4fbf" text-anchor="middle">BY AIR MAIL</text>
      <rect x="274" y="116" width="58" height="70" fill="${ACID}" stroke="${INK}" stroke-width="2"/>
      <circle cx="303" cy="146" r="16" fill="${ORANGE}" stroke="${INK}" stroke-width="2"/>
      <path d="M296 150 q7 7 14 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="297" cy="142" r="2" fill="${INK}"/><circle cx="309" cy="142" r="2" fill="${INK}"/>
      <g fill="none" stroke="#3a3540" stroke-width="2" opacity="0.75">
        <circle cx="262" cy="182" r="26"/><circle cx="262" cy="182" r="19"/>
        <path d="M200 176 q10 -6 20 0 t20 0 t20 0 M200 188 q10 -6 20 0 t20 0 t20 0"/>
      </g>
      <text x="262" y="186" font-family="${MONO}" font-weight="700" font-size="7" fill="#3a3540" text-anchor="middle">UI·STICKS</text>
      <text x="92" y="236" font-family="${HAND}" font-size="22" fill="${INK}">to: whoever ships it</text>
      <text x="92" y="266" font-family="${HAND}" font-size="16" fill="${INK}" opacity="0.8">with love, scout ui ♥</text>
    </g>`,

  "postage-stamp": () => `
    <mask id="m-stamp"><rect width="400" height="400" fill="#fff"/><g fill="#000">${perforatedRect(92, 58, 216, 284, 7, 20)}</g></mask>
    <g transform="rotate(8 200 200)" mask="url(#m-stamp)">
      <rect x="92" y="58" width="216" height="284" fill="#fffaf0"/>
      <rect x="112" y="78" width="176" height="244" fill="${COBALT}"/>
      <rect x="112" y="78" width="176" height="244" fill="url(#dotsLight)"/>
      <circle cx="200" cy="186" r="58" fill="${ACID}" stroke="${INK}" stroke-width="4"/>
      <circle cx="182" cy="176" r="6" fill="${INK}"/><circle cx="218" cy="176" r="6" fill="${INK}"/>
      <path d="M176 200 q24 26 48 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <text x="124" y="110" font-family="${SANS}" font-weight="900" font-size="26" fill="#fffaf0">25¢</text>
      <text x="200" y="282" font-family="${SANS}" font-weight="900" font-size="20" fill="#fffaf0" text-anchor="middle" letter-spacing="1">OPEN SOURCE</text>
      <text x="200" y="306" font-family="${SANS}" font-weight="700" font-size="13" fill="${ACID}" text-anchor="middle" letter-spacing="3">SCOUT POST</text>
    </g>`,

  "embroidered-patch": () => `
    <g transform="rotate(-6 200 200)">
      <circle cx="200" cy="200" r="150" fill="${INK}"/>
      <circle cx="200" cy="200" r="138" fill="${UV}"/>
      <circle cx="200" cy="200" r="138" fill="url(#twill)"/>
      <circle cx="200" cy="200" r="144" fill="none" stroke="${ACID}" stroke-width="4" stroke-dasharray="6 5"/>
      <circle cx="200" cy="200" r="78" fill="${ACID}" stroke="${INK}" stroke-width="5"/>
      <circle cx="200" cy="200" r="78" fill="url(#twill)"/>
      <path d="${starburst(200, 200, 5, 54, 24)}" fill="${PINK}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      ${arcText("UI THAT STICKS", 200, 200, 106, -150, -30, 30, PAPER, false)}
      ${arcText("SCOUT · EST 2026", 200, 200, 118, 145, 35, 18, ACID, true)}
    </g>`,

  "instant-photo": () => `
    <defs><clipPath id="photo-window"><rect x="96" y="70" width="208" height="206"/></clipPath></defs>
    <g transform="rotate(-7 200 200)">
      <rect x="78" y="52" width="244" height="300" rx="4" fill="#fdfcf8"/>
      <g clip-path="url(#photo-window)">
        <rect x="96" y="70" width="208" height="206" fill="url(#sky)"/>
        <circle cx="250" cy="122" r="30" fill="${ACID}" stroke="${INK}" stroke-width="4"/>
        <path d="M96 236 q52 -40 104 -6 t104 -8 V276 H96Z" fill="${UV}"/>
        <path d="M96 254 q60 -26 120 0 t88 -4 V276 H96Z" fill="${INK}"/>
        <rect x="96" y="70" width="208" height="206" fill="url(#dotsLight)"/>
      </g>
      <text x="200" y="322" font-family="${HAND}" font-size="28" fill="${INK}" text-anchor="middle" transform="rotate(-3 200 322)">v0.1 day ☺</text>
    </g>`,

  "floppy-disk": () => `
    <g transform="rotate(6 200 200)">
      <path d="M70 60 H300 L330 90 V340 H70 Z" fill="${COBALT}"/>
      <rect x="128" y="60" width="140" height="92" fill="url(#metal)"/>
      <rect x="226" y="72" width="26" height="68" fill="${COBALT}"/>
      <rect x="98" y="186" width="204" height="138" rx="4" fill="#fdfcf8"/>
      <rect x="98" y="186" width="204" height="22" fill="${PINK}"/>
      <g stroke="#9fb6e8" stroke-width="2"><line x1="110" y1="240" x2="290" y2="240"/><line x1="110" y1="268" x2="290" y2="268"/><line x1="110" y1="296" x2="290" y2="296"/></g>
      <text x="112" y="234" font-family="${HAND}" font-size="22" fill="${INK}">SCOUT_UI.zip</text>
      <text x="112" y="262" font-family="${HAND}" font-size="18" fill="${UV}">8 components</text>
      <text x="112" y="290" font-family="${HAND}" font-size="16" fill="${INK}">DO NOT ERASE!!</text>
      <text x="290" y="203" font-family="${SANS}" font-weight="900" font-size="12" fill="#fdfcf8" text-anchor="end">1.44 MB</text>
      <rect x="80" y="318" width="12" height="14" fill="${INK}"/>
    </g>`,

  receipt: () => {
    let zig = "M120 60";
    for (let x = 120; x < 280; x += 16) zig += ` L${x + 8} 50 L${x + 16} 60`;
    zig += " L280 340";
    for (let x = 280; x > 120; x -= 16) zig += ` L${x - 8} 350 L${x - 16} 340`;
    zig += " Z";
    const lines = [
      ["1 STICKER", "0.00"],
      ["1 BUTTON", "0.00"],
      ["1 BADGE", "0.00"],
      ["1 TRAIL", "0.00"],
      ["1 CURSOR", "0.00"],
      ["1 PEEL", "0.00"],
      ["1 STACK", "0.00"],
      ["1 NAVBAR", "0.00"],
    ];
    const rows = lines
      .map(
        ([a, b], i) =>
          `<text x="134" y="${126 + i * 17}" font-family="${MONO}" font-size="11" fill="${INK}">${a}</text><text x="266" y="${126 + i * 17}" font-family="${MONO}" font-size="11" fill="${INK}" text-anchor="end">${b}</text>`,
      )
      .join("");
    return `
    <g transform="rotate(-4 200 200)">
      <path d="${zig}" fill="#fefefb"/>
      <text x="200" y="92" font-family="${MONO}" font-weight="700" font-size="16" fill="${INK}" text-anchor="middle">SCOUT UI STORE</text>
      <text x="200" y="108" font-family="${MONO}" font-size="10" fill="${INK}" text-anchor="middle">OPEN 24/7 · NO ACCOUNT</text>
      ${rows}
      <line x1="134" y1="270" x2="266" y2="270" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="134" y="290" font-family="${MONO}" font-weight="700" font-size="15" fill="${INK}">TOTAL</text>
      <text x="266" y="290" font-family="${MONO}" font-weight="700" font-size="15" fill="${INK}" text-anchor="end">$0.00</text>
      <text x="200" y="308" font-family="${MONO}" font-size="10" fill="${UV}" text-anchor="middle">LICENSE: MIT · STICK AROUND</text>
      ${barcode(140, 314, 120, 20, 42)}
    </g>`;
  },

  "name-tag": () => `
    <g transform="rotate(5 200 200)">
      <rect x="44" y="96" width="312" height="208" rx="22" fill="#e5262b"/>
      <rect x="62" y="166" width="276" height="118" rx="8" fill="#fffdf6"/>
      <text x="200" y="136" font-family="${SANS}" font-weight="900" font-size="38" fill="#fffdf6" text-anchor="middle" letter-spacing="2">HELLO</text>
      <text x="200" y="157" font-family="${SANS}" font-weight="700" font-size="15" fill="#fffdf6" text-anchor="middle">my name is</text>
      <text x="200" y="250" font-family="${HAND}" font-size="54" fill="${INK}" text-anchor="middle" transform="rotate(-5 200 240)">Sticker</text>
    </g>`,

  "fragile-label": () => `
    <g transform="rotate(-8 200 200)">
      <rect x="54" y="104" width="292" height="192" rx="6" fill="#fffef8"/>
      <rect x="54" y="104" width="292" height="62" rx="6" fill="#df2b2b"/>
      <rect x="54" y="150" width="292" height="16" fill="#df2b2b"/>
      <text x="200" y="152" font-family="${SANS}" font-weight="900" font-size="46" fill="#fffef8" text-anchor="middle" letter-spacing="3">FRAGILE</text>
      <path d="M92 194 h34 l-6 40 q-11 10 -22 0 Z M109 240 v24 M96 266 h26" fill="none" stroke="#df2b2b" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
      <text x="146" y="204" font-family="${SANS}" font-weight="900" font-size="15" fill="${INK}">HANDLE WITH CARE</text>
      <text x="146" y="226" font-family="${SANS}" font-weight="700" font-size="13" fill="${INK}">CONTAINS: STICKERS</text>
      <path d="M326 246 l-14 18 h9 v20 h10 v-20 h9 Z" fill="${INK}"/>
      ${barcode(146, 246, 140, 34, 7)}
    </g>`,

  "foil-seal": () => `
    <g transform="rotate(12 200 200)">
      <path d="${starburst(200, 200, 24, 150, 128)}" fill="url(#foil)" stroke="#7a5512" stroke-width="3"/>
      <circle cx="200" cy="200" r="108" fill="none" stroke="#7a5512" stroke-width="3"/>
      <circle cx="200" cy="200" r="98" fill="url(#foil)"/>
      <path d="M150 200 l32 32 l66 -70" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="200" y="152" font-family="${SANS}" font-weight="900" font-size="20" fill="#5a3d08" text-anchor="middle" letter-spacing="2">100%</text>
      <text x="200" y="272" font-family="${SANS}" font-weight="900" font-size="18" fill="#5a3d08" text-anchor="middle" letter-spacing="2">OPEN SOURCE</text>
    </g>`,

  "pixel-heart": () => {
    const map = [
      "..XXX...XXX..",
      ".XPPPX.XPPPX.",
      "XPWWPPXPPPPPX",
      "XPWPPPPPPPPPX",
      "XPPPPPPPPPPPX",
      ".XPPPPPPPPPX.",
      "..XPPPPPPPX..",
      "...XPPPPPX...",
      "....XPPPX....",
      ".....XPX.....",
      "......X......",
    ];
    const cell = 22;
    const ox = 200 - (13 * cell) / 2;
    const oy = 200 - (11 * cell) / 2 - 10;
    const colors = { P: PINK, W: "#fff", X: INK };
    let rects = "";
    map.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c !== ".")
          rects += `<rect x="${ox + x * cell}" y="${oy + y * cell}" width="${cell}" height="${cell}" fill="${colors[c]}"/>`;
      }),
    );
    return `<g transform="rotate(-6 200 200)">${rects}
      <text x="200" y="${oy + 11 * cell + 34}" font-family="${MONO}" font-weight="700" font-size="24" fill="${INK}" text-anchor="middle">1UP</text></g>`;
  },
};

await mkdir(outDir, { recursive: true });
await mkdir(sourceDir, { recursive: true });
const manifest = [];
for (const [id, draw] of Object.entries(stickers)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${defs}
  <g filter="url(#cut)"><g filter="url(#sheen)"><g filter="url(#grain)">${draw()}</g></g></g></svg>`;
  await writeFile(path.join(sourceDir, `${id}.svg`), svg);
  await sharp(Buffer.from(svg), { density: 144 })
    .resize(400, 400)
    .webp({ alphaQuality: 90, effort: 6, quality: 82 })
    .toFile(path.join(outDir, `${id}.webp`));
  manifest.push(id);
}
console.log(
  `Generated ${String(manifest.length)} collage stickers: ${manifest.join(", ")}`,
);
