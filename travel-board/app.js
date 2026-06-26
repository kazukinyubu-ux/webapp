import { CELLS } from "./data.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const board = document.getElementById("board");

if (!board) {
  throw new Error('Element with id="board" was not found.');
}

const svg = document.createElementNS(SVG_NS, "svg");
svg.setAttribute("viewBox", "0 0 1600 900");
svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
board.appendChild(svg);

appendDefs();
drawConnections();
CELLS.forEach(drawCell);

function appendDefs() {
  const defs = document.createElementNS(SVG_NS, "defs");
  defs.innerHTML = `
    <linearGradient id="seaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dff4ff" />
      <stop offset="100%" stop-color="#b8deea" />
    </linearGradient>

    <linearGradient id="islandGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f9e8be" />
      <stop offset="55%" stop-color="#eecf95" />
      <stop offset="100%" stop-color="#cfa25d" />
    </linearGradient>

    <linearGradient id="shoreGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff4d8" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#ffe0a2" stop-opacity="0.15" />
    </linearGradient>

    <filter id="islandShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="8" dy="12" stdDeviation="8" flood-color="#6b563d" flood-opacity="0.25" />
    </filter>

    <filter id="palmShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="2" dy="4" stdDeviation="2" flood-color="#5c452c" flood-opacity="0.24" />
    </filter>
  `;
  svg.appendChild(defs);
}

function drawConnections() {
  for (let i = 0; i < CELLS.length - 1; i++) {
    const from = CELLS[i];
    const to = CELLS[i + 1];

    const path = document.createElementNS(SVG_NS, "path");
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;

    path.setAttribute("d", `M ${from.x} ${from.y} Q ${mx} ${my - 42} ${to.x} ${to.y}`);
    path.setAttribute("class", "path-line");
    svg.appendChild(path);
  }
}

function drawCell(cell) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "cell");
  group.dataset.id = String(cell.id);

  const pathD = createIslandPath(cell.x, cell.y, 112, 74, cell.id);

  const shadow = document.createElementNS(SVG_NS, "path");
  shadow.setAttribute("d", pathD);
  shadow.setAttribute("class", "island-shadow");
  shadow.setAttribute("transform", "translate(8 10)");
  group.appendChild(shadow);

  const base = document.createElementNS(SVG_NS, "path");
  base.setAttribute("d", pathD);
  base.setAttribute("class", "island-base");
  base.setAttribute("filter", "url(#islandShadow)");
  group.appendChild(base);

  const highlight = document.createElementNS(SVG_NS, "path");
  highlight.setAttribute("d", createHighlightPath(cell.x, cell.y, 106, 66, cell.id));
  highlight.setAttribute("class", "island-highlight");
  group.appendChild(highlight);

  const outline = document.createElementNS(SVG_NS, "path");
  outline.setAttribute("d", pathD);
  outline.setAttribute("class", "island-outline");
  group.appendChild(outline);

  if (cell.id % 4 === 1 || cell.id % 7 === 0) {
    appendPalmTree(group, cell.x - 48, cell.y - 52, 0.95);
  }

  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("x", String(cell.x));
  text.setAttribute("y", String(cell.y - 2));

  const lines = wrapText(String(cell.text ?? ""), 8);
  lines.forEach((line, index) => {
    const tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.setAttribute("x", String(cell.x));
    tspan.setAttribute("dy", index === 0 ? "0" : "1.25em");
    tspan.textContent = line;
    text.appendChild(tspan);
  });

  group.appendChild(text);
  svg.appendChild(group);
}

function createIslandPath(cx, cy, rx, ry, seed = 0) {
  const wobble = [
    [1.08, 0.90],
    [1.16, 0.98],
    [1.04, 1.10],
    [0.90, 1.15],
    [0.78, 1.00],
    [0.86, 0.84],
    [0.96, 0.78],
    [1.10, 0.88],
  ];

  const points = [];
  const rotationOffset = (seed % 5) * 4;

  for (let i = 0; i < 8; i++) {
    const angle = (((-30 + i * 45 + rotationOffset) * Math.PI) / 180);
    const [wx, wy] = wobble[(i + seed) % wobble.length];
    points.push({
      x: cx + Math.cos(angle) * rx * wx,
      y: cy + Math.sin(angle) * ry * wy,
    });
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const n = points[(i + 1) % points.length];
    const mx = (p.x + n.x) / 2;
    const my = (p.y + n.y) / 2;
    d += ` Q ${p.x} ${p.y} ${mx} ${my}`;
  }
  d += " Z";
  return d;
}

function createHighlightPath(cx, cy, rx, ry, seed = 0) {
  const offsetX = seed % 3 === 0 ? -18 : -14;
  const offsetY = seed % 2 === 0 ? -16 : -12;
  const w = rx * 0.78;
  const h = ry * 0.42;

  return [
    `M ${cx - w + offsetX} ${cy - h + offsetY}`,
    `C ${cx - w * 0.55 + offsetX} ${cy - h * 1.4 + offsetY} ${cx + w * 0.10} ${cy - h * 1.2} ${cx + w * 0.28} ${cy - h * 0.7}`,
    `C ${cx + w * 0.15} ${cy - h * 0.15} ${cx - w * 0.25} ${cy + h * 0.10} ${cx - w * 0.55 + offsetX} ${cy - h * 0.15 + offsetY}`,
    "Z",
  ].join(" ");
}

function appendPalmTree(group, x, y, scale = 1) {
  const palm = document.createElementNS(SVG_NS, "g");
  palm.setAttribute("filter", "url(#palmShadow)");
  palm.setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
  group.appendChild(palm);

  const trunk = document.createElementNS(SVG_NS, "path");
  trunk.setAttribute("d", "M 22 78 C 18 60, 24 42, 28 26 C 31 14, 29 8, 24 0");
  trunk.setAttribute("class", "palm-trunk");
  palm.appendChild(trunk);

  const leaves = [
    "M 24 4 C 8 4, 0 10, -8 20",
    "M 24 4 C 38 0, 48 6, 58 16",
    "M 24 4 C 20 -10, 10 -18, 0 -24",
    "M 24 4 C 28 -12, 42 -18, 56 -18",
  ];

  leaves.forEach((d, index) => {
    const leaf = document.createElementNS(SVG_NS, "path");
    leaf.setAttribute("d", d);
    leaf.setAttribute("class", `palm-leaf palm-leaf--${index + 1}`);
    palm.appendChild(leaf);
  });

  const coconuts = document.createElementNS(SVG_NS, "circle");
  coconuts.setAttribute("cx", "24");
  coconuts.setAttribute("cy", "6");
  coconuts.setAttribute("r", "4");
  coconuts.setAttribute("class", "palm-coconut");
  palm.appendChild(coconuts);
}

function wrapText(text, maxChars) {
  if (text.length <= maxChars) return [text];

  const lines = [];
  let current = "";

  for (const char of text) {
    if (current.length >= maxChars) {
      lines.push(current);
      current = char;
    } else {
      current += char;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}