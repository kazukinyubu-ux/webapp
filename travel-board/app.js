import { DAYS } from "./data.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEW_W = 1600;
const VIEW_H = 900;

const CELL_W = 180;
const CELL_H = 84;
const GAP_X = 18;
const GAP_Y = 14;

const MIN_COLS = 4;
const MAX_COLS = 7;
const TARGET_ROWS = 6;

const ROW_WAVE = [0, 10, 18, 12, 4, -6, 2];
const COL_WAVE = [0, 4, 10, 6, 2, -2, 0];

const board = document.getElementById("board");

if (!board) {
  throw new Error('Element with id="board" was not found.');
}

const svg = document.createElementNS(SVG_NS, "svg");
svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
board.appendChild(svg);

const cells = buildCells(DAYS);
const layout = createLayout(cells.length);

appendDefs();
drawConnections(cells.length, layout);
cells.forEach((cell, index) => drawCell(cell, getPosition(index, layout)));

function buildCells(days) {
  const result = [];

  result.push({
    type: "start",
    label: "START",
    color: "#65C39A",
  });

  days.forEach((day) => {
    result.push({
      type: "day",
      label: day.title,
      color: day.color,
    });

    day.events.forEach((eventText) => {
      result.push({
        type: "event",
        label: eventText,
        color: day.color,
      });
    });
  });

  result.push({
    type: "goal",
    label: "GOAL",
    color: "#F48C8C",
  });

  return result;
}

function createLayout(total) {
  const cols = clamp(Math.ceil(total / TARGET_ROWS), MIN_COLS, MAX_COLS);
  const rows = Math.ceil(total / cols);

  const contentWidth = cols * CELL_W + (cols - 1) * GAP_X;
  const contentHeight = rows * CELL_H + (rows - 1) * GAP_Y;

  return {
    cols,
    rows,
    startX: (VIEW_W - contentWidth) / 2,
    startY: Math.max(28, (VIEW_H - contentHeight) / 2),
  };
}

function getPosition(index, layout) {
  const row = Math.floor(index / layout.cols);
  const col = index % layout.cols;
  const reverse = row % 2 === 1;

  const localCol = reverse ? layout.cols - 1 - col : col;

  const baseX =
    layout.startX + localCol * (CELL_W + GAP_X) + CELL_W / 2;

  const baseY =
    layout.startY + row * (CELL_H + GAP_Y) + CELL_H / 2;

  const waveY = ROW_WAVE[row % ROW_WAVE.length] + COL_WAVE[col % COL_WAVE.length];

  return {
    x: baseX,
    y: baseY + waveY,
    row,
    col,
  };
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

function drawConnections(total, layout) {
  for (let i = 0; i < total - 1; i++) {
    const from = getPosition(i, layout);
    const to = getPosition(i + 1, layout);

    const path = document.createElementNS(SVG_NS, "path");
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const bend = from.row === to.row ? -18 : -28;

    path.setAttribute(
      "d",
      `M ${from.x} ${from.y} Q ${mx} ${my + bend} ${to.x} ${to.y}`
    );
    path.setAttribute("class", "path-line");
    svg.appendChild(path);
  }
}

function drawCell(cell, pos) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", `cell cell--${cell.type}`);
  group.dataset.type = cell.type;
  group.style.setProperty("--accent", cell.color);

  const shadow = document.createElementNS(SVG_NS, "rect");
  setBoxAttributes(shadow, pos.x + 5, pos.y + 6);
  shadow.setAttribute("class", "cell-shadow");
  group.appendChild(shadow);

  const bg = document.createElementNS(SVG_NS, "rect");
  setBoxAttributes(bg, pos.x, pos.y);
  bg.setAttribute("class", `cell-box cell-box--${cell.type}`);
  bg.setAttribute("filter", "url(#cellShadow)");
  group.appendChild(bg);

  const topBar = document.createElementNS(SVG_NS, "rect");
  topBar.setAttribute("x", String(pos.x - CELL_W / 2));
  topBar.setAttribute("y", String(pos.y - CELL_H / 2));
  topBar.setAttribute("width", String(CELL_W));
  topBar.setAttribute("height", "14");
  topBar.setAttribute("rx", "18");
  topBar.setAttribute("ry", "18");
  topBar.setAttribute("class", "cell-accent");
  group.appendChild(topBar);

  const label = document.createElementNS(SVG_NS, "text");
  label.setAttribute("x", String(pos.x));
  label.setAttribute("y", String(pos.y - 2));
  label.setAttribute("class", `cell-text cell-text--${cell.type}`);

  const lines = wrapText(cell.label, cell.type === "day" ? 5 : 9);
  lines.forEach((line, index) => {
    const tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.setAttribute("x", String(pos.x));
    tspan.setAttribute("dy", index === 0 ? "0" : "1.18em");
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}