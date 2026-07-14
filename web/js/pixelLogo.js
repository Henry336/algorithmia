const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
};

/** Draws the title from square pixels so it stays crisp without a font download. */
export function renderPixelLogo(canvas, text = "ALGORITHMIA") {
  if (!canvas) return;
  const pixel = 8;
  const glyphWidth = 5;
  const gap = 1;
  const width = (text.length * (glyphWidth + gap) - gap) * pixel;
  const height = 7 * pixel;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);

  [...text].forEach((character, characterIndex) => {
    const glyph = GLYPHS[character];
    if (!glyph) return;
    glyph.forEach((row, y) => {
      [...row].forEach((filled, x) => {
        if (filled !== "1") return;
        const drawX = (characterIndex * (glyphWidth + gap) + x) * pixel;
        const drawY = y * pixel;
        context.fillStyle = "#17333a";
        context.fillRect(drawX + 2, drawY + 2, pixel, pixel);
        context.fillStyle = "#72d4c3";
        context.fillRect(drawX, drawY, pixel, pixel);
        context.fillStyle = "#b9fff0";
        context.fillRect(drawX + 1, drawY + 1, pixel - 3, 2);
      });
    });
  });
}
