export function fitRoomViewportToScreen(viewport, cols, rows, tileSize) {
  if (!viewport) return;
  const naturalWidth = cols * tileSize;
  const naturalHeight = rows * tileSize;
  const availableWidth = Math.max(320, window.innerWidth - 32);
  const availableHeight = Math.max(280, window.innerHeight - 118);
  const scale = Math.max(
    0.55,
    Math.min(1.65, availableWidth / naturalWidth, availableHeight / naturalHeight)
  );
  viewport.style.transform = `scale(${scale})`;
  viewport.style.marginBottom = scale > 1 ? `${(scale - 1) * naturalHeight}px` : "";
}
