import { DAYS } from "./data.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEW_W = 1600;
const VIEW_H = 900;

const COLS = 5;
const CELL_W = 220;
const CELL_H = 82;
const GAP_X = 24;
const GAP_Y = 14;

const board = document.getElementById("board");

if (!board) {
  throw new Error('Element with id="board" was not found.');
}

const svg = document.createElementNS(SVG_NS, "svg");
svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
board.appendChild(svg);

const CELLS = buildCells(DAYS);
const layout = createLayout(CELLS.length);

appendDefs();
drawConnections(CELLS, layout);
CELLS.forEach((cell, index) => drawCell(cell, getPosition(index, layout)));

function buildCells(days) {
  const cells = [];

  cells.push({
    type: "start",
    label: "START",
    color: "#65C39A",
  });

  days.forEach((day) => {
    cells.push({
      type: "day",
      label: day.title,
      color: day.color,
    });

    day.events.forEach((eventText) => {
      cells.push({
        type: "event",
        label: eventText,
        color: day.color,
      });
    });
  });

  cells.push({
    type: "goal",
    label: "GOAL",
    color: "#F48C8C",
  });

  return cells;
}

function createLayout(total) {
  const rows = Math.ceil(total / COLS);
  const contentWidth = COLS * CELL_W + (COLS - 1) * GAP_X;
  const contentHeight = rows * CELL_H + (rows - 1) * GAP_Y;

  const startX = (VIEW_W - contentWidth) / 2;
  const startY = Math.max(36, (VIEW_H - contentHeight) / 2);

  return {
    rows,
    startX,
    startY,
  };
}

function getPosition(index, layout) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const reverse = row % 2 === 1;

  const x =
    layout.startX +
    (reverse ? COLS - 1 - col : col) * (CELL_W + GAP_X) +
    CELL_W / 2;

  const y = layout.startY + row * (CELL_H + GAP_Y) + CELL_H / 2;

  return { x, y, row, col };
}

function appendDefs() {
  const defs = document.createElementNS(SVG_NS, "defs");
  defs.innerHTML = `
    <filter id="cellShadow" x="-30%" y="-30%" width="170%" height="170%">
      <feDropShadow dx="0" dy="7" stdDeviation="6" flood-color="#5c452c" flood-opacity="0.18" />
    </filter>
  `;
  svg.appendChild(defs);
}

function drawConnections(cells, layout) {
  for (let i = 0; i < cells.length - 1; i++) {
    const from = getPosition(i, layout);
    const to = getPosition(i + 1, layout);

    const path = document.createElementNS(SVG_NS, "path");
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;

    path.setAttribute("d", `M ${from.x} ${from.y} Q ${mx} ${my - 38} ${to.x} ${to.y}`);
    path.setAttribute("class", "path-line");
    svg.appendChild(path);
  }
}

function drawCell(cell, pos) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", `cell cell--${cell.type}`);
  group.dataset.type = cell.type;

  const shadow = document.createElementNS(SVG_NS, "rect");
  setBoxAttributes(shadow, pos.x + 5, pos.y + 6);
  shadow.setAttribute("class", "cell-shadow");
  group.appendChild(shadow);

  const bg = document.createElementNS(SVG_NS, "rect");
  setBoxAttributes(bg, pos.x, pos.y);
  bg.setAttribute("class", `cell-box cell-box--${cell.type}`);
  bg.setAttribute("filter", "url(#cellShadow)");
  group.appendChild(bg);

  const accent = document.createElementNS(SVG_NS, "rect");
  accent.setAttribute("x", String(pos.x - CELL_W / 2));
  accent.setAttribute("y", String(pos.y - CELL_H / 2));
  accent.setAttribute("width", String(CELL_W));
  accent.setAttribute("height", "14");
  accent.setAttribute("rx", "18");
  accent.setAttribute("ry", "18");
  accent.setAttribute("class", `cell-accent cell-accent--${cell.type}`);
  group.appendChild(accent);

  const label = document.createElementNS(SVG_NS, "text");
  label.setAttribute("x", String(pos.x));
  label.setAttribute("y", String(pos.y - 3));
  label.setAttribute("class", `cell-text cell-text--${cell.type}`);

  const lines = wrapText(cell.label, cell.type === "day" ? 5 : 9);
  lines.forEach((line, index) => {
    const tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.setAttribute("x", String(pos.x));
    tspan.setAttribute("dy", index === 0 ? "0" : "1.2em");
    tspan.textContent = line;
    label.appendChild(tspan);
  });

  group.appendChild(label);

  svg.appendChild(group);
}

function setBoxAttributes(node, x, y) {
  node.setAttribute("x", String(x - CELL_W / 2));
  node.setAttribute("y", String(y - CELL_H / 2));
  node.setAttribute("width", String(CELL_W));
  node.setAttribute("height", String(CELL_H));
  node.setAttribute("rx", "18");
  node.setAttribute("ry", "18");
}

function wrapText(text, maxChars) {
  const str = String(text ?? "");
  if (str.length <= maxChars) return [str];

  const lines = [];
  let current = "";

  for (const char of str) {
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