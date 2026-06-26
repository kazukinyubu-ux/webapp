import { CELLS } from "./data.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const board = document.getElementById("board");

// SVG作成
const svg = document.createElementNS(SVG_NS, "svg");
svg.setAttribute("viewBox", "0 0 320 1450");

board.appendChild(svg);

// 接続線
drawConnections();

// マス
CELLS.forEach(drawCell);

/* ========================= */

function drawConnections() {
  for (let i = 0; i < CELLS.length - 1; i++) {
    const from = CELLS[i];
    const to = CELLS[i + 1];

    const line = document.createElementNS(SVG_NS, "line");

    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);

    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);

    line.setAttribute("stroke", "#999");
    line.setAttribute("stroke-width", "3");

    svg.appendChild(line);
  }
}

function drawCell(cell) {
  const group = document.createElementNS(SVG_NS, "g");

  group.dataset.id = cell.id;

  // 六角形
  const hex = document.createElementNS(SVG_NS, "polygon");

  hex.setAttribute(
    "points",
    createHexagon(cell.x, cell.y, 38)
  );

  hex.setAttribute("fill", "#ffffff");
  hex.setAttribute("stroke", "#444");
  hex.setAttribute("stroke-width", "2");

  group.appendChild(hex);

  // イベント文字
  const text = document.createElementNS(SVG_NS, "text");

  text.setAttribute("x", cell.x);
  text.setAttribute("y", cell.y + 5);

  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", "10");

  text.textContent = cell.text;

  group.appendChild(text);

  svg.appendChild(group);
}

function createHexagon(cx, cy, size) {

  const points = [];

  for (let i = 0; i < 6; i++) {

    const angle = (Math.PI / 180) * (60 * i - 30);

    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);

    points.push(`${x},${y}`);

  }

  return points.join(" ");
}