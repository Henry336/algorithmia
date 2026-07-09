// Renders a small hand-authored pixel matrix onto a <canvas>, scaled up with
// nearest-neighbor so it stays crisp. Placeholder art, easily swappable for a
// real exported sprite sheet later (drop an <img> in instead of the canvas).

export function applyPixelArt(el, matrix, palette, pixelSize) {
  const cols = Math.max(...matrix.map((line) => line.length));
  const rows = matrix.length;

  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  canvas.style.width = `${cols * pixelSize}px`;
  canvas.style.height = `${rows * pixelSize}px`;
  canvas.style.imageRendering = "pixelated";
  canvas.style.display = "block";

  const ctx = canvas.getContext("2d");
  for (let row = 0; row < rows; row++) {
    const line = matrix[row];
    for (let col = 0; col < line.length; col++) {
      const code = line[col];
      if (code === "." || code === " ") continue;
      const color = palette[code];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(col, row, 1, 1);
    }
  }

  el.innerHTML = "";
  el.appendChild(canvas);
  return canvas;
}

export function spriteSize(matrix, pixelSize) {
  const width = Math.max(...matrix.map((line) => line.length)) * pixelSize;
  const height = matrix.length * pixelSize;
  return { width, height };
}
