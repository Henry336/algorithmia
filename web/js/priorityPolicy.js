// Max-heap extraction order: highest priority is served first; equal
// priority keeps arrival order (stable), matching a textbook priority
// queue rather than a raw unstable sort.

export function solvePriorityOrder(items) {
  return items
    .slice()
    .sort((a, b) => b.priority - a.priority || a.arrival - b.arrival)
    .map((item) => item.id);
}
