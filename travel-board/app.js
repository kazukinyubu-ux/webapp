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

drawConnections();
CELLS.forEach(drawCell);

function drawConnections() {
  for (let i = 0; i < CELLS.length - 1; i++) {
    const from = CELLS[i];
    const to = CELLS[i + 1];
    const path = document.createElementNS(SVG_NS, "path");
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;

    path.setAttribute(
      "d",
      `M ${from.x} ${from.y} Q ${mx} ${my - 42} ${to.x} ${to.y}`
    );
    path.setAttribute("class", "path-line");
    svg.appendChild(path);
  }
}

function drawCell(cell) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "cell");
  group.dataset.id = String(cell.id);

  const shapeType = cell.id % 3;
  const rotation = typeof cell.rotate === "number" ? cell.rotate : cell.id % 2 === 0 ? 2.8 : -2.8;

  if (shapeType === 1) {
    appendRoundedRect(group, cell, rotation);
  } else if (shapeType === 2) {
    appendEllipse(group, cell, rotation);
  } else {
    appendHex(group, cell, rotation);
  }

  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("x", String(cell.x));
  text.setAttribute("y", String(cell.y - 3));

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

function appendRoundedRect(group, cell, rotation) {
  const fill = document.createElementNS(SVG_NS, "rect");
  setRoundedRectAttributes(fill, cell, rotation);
  fill.setAttribute("class", "island-fill");
  group.appendChild(fill);

  const stroke = document.createElementNS(SVG_NS, "rect");
  setRoundedRectAttributes(stroke, cell, rotation);
  stroke.setAttribute("class", "island-stroke");
  group.appendChild(stroke);
}

function setRoundedRectAttributes(node, cell, rotation) {
  node.setAttribute("x", String(cell.x - 86));
  node.setAttribute("y", String(cell.y - 52));
  node.setAttribute("width", "172");
  node.setAttribute("height", "104");
  node.setAttribute("rx", "34");
  node.setAttribute("ry", "34");
  node.setAttribute("transform", `rotate(${rotation} ${cell.x} ${cell.y})`);
}

function appendEllipse(group, cell, rotation) {
  const fill = document.createElementNS(SVG_NS, "ellipse");
  fill.setAttribute("cx", String(cell.x));
  fill.setAttribute("cy", String(cell.y));
  fill.setAttribute("rx", "88");
  fill.setAttribute("ry", "54");
  fill.setAttribute("class", "island-fill");
  fill.setAttribute("transform", `rotate(${rotation} ${cell.x} ${cell.y})`);
  group.appendChild(fill);

  const stroke = document.createElementNS(SVG_NS, "ellipse");
  stroke.setAttribute("cx", String(cell.x));
  stroke.setAttribute("cy", String(cell.y));
  stroke.setAttribute("rx", "88");
  stroke.setAttribute("ry", "54");
  stroke.setAttribute("class", "island-stroke");
  stroke.setAttribute("transform", `rotate(${rotation} ${cell.x} ${cell.y})`);
  group.appendChild(stroke);
}

function appendHex(group, cell, rotation) {
  const points = createHexPoints(cell.x, cell.y, 92, 62);

  const fill = document.createElementNS(SVG_NS, "polygon");
  fill.setAttribute("points", points);
  fill.setAttribute("class", "island-fill");
  fill.setAttribute("transform", `rotate(${rotation} ${cell.x} ${cell.y})`);
  group.appendChild(fill);

  const stroke = document.createElementNS(SVG_NS, "polygon");
  stroke.setAttribute("points", points);
  stroke.setAttribute("class", "island-stroke");
  stroke.setAttribute("transform", `rotate(${rotation} ${cell.x} ${cell.y})`);
  group.appendChild(stroke);
}

function createHexPoints(cx, cy, rx, ry) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
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