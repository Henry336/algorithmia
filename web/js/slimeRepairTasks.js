// Everything the Repair screen shows or tests lives here.
// Change this file when you want to adjust a prompt, starter, hint, or testcase.
export const SLIME_REPAIR_TASKS = {
  1: {
    title: "Stabilize the insertion march",
    requirement: "Return a new ascending list. Built-in sorting shortcuts are disabled.",
    example: "Example: [3, 1, 2] becomes [1, 2, 3].",
    starter: `def solve(values):
    ordered = values[:]
    for i in range(len(ordered)):
        for j in range(len(ordered) - 1 - i):
            if ordered[j] > ordered[j + 1]:
                # TODO: swap these neighboring values
    return ordered`,
    hints: [
      "The larger value is on the left. Exchange it with the smaller value immediately to its right.",
      "Replace the TODO with: ordered[j], ordered[j + 1] = ordered[j + 1], ordered[j]",
    ],
    cases: [
      { name: "visible_spill", input: [5, 1, 4, 2, 3], expected: [1, 2, 3, 4, 5], sealed: false },
      { name: "visible_duplicates", input: [3, 1, 3, 2], expected: [1, 2, 3, 3], sealed: false },
      { name: "sealed_reverse", input: [7, 6, 4, 2, 1], expected: [1, 2, 4, 6, 7], sealed: true },
      { name: "sealed_edges", input: [0, -2, 8, -2, 5], expected: [-2, -2, 0, 5, 8], sealed: true },
    ],
    success: "Column heights now rise 1-2-3-4-5 and descend predictably.",
  },
  2: {
    title: "Merge the split allocations",
    requirement: "The first and second halves are sorted runs. Merge them without sorting shortcuts.",
    example: "Example: [1, 4, 2, 3] becomes [1, 2, 3, 4].",
    starter: `def solve(values):
    merged = values[:]
    for i in range(len(merged)):
        for j in range(len(merged) - 1 - i):
            # TODO: replace False with the out-of-order check
            if False:
                merged[j], merged[j + 1] = merged[j + 1], merged[j]
    return merged`,
    hints: [
      "The existing swap is correct. It should run only when the current value is larger than the next value.",
      "Replace False with: merged[j] > merged[j + 1]",
    ],
    cases: [
      { name: "visible_even_runs", input: [1, 4, 7, 2, 3, 9], expected: [1, 2, 3, 4, 7, 9], sealed: false },
      { name: "visible_overlap", input: [0, 5, 8, 1, 5, 6], expected: [0, 1, 5, 5, 6, 8], sealed: false },
      { name: "sealed_negative", input: [-7, -1, 4, -5, 2, 8], expected: [-7, -5, -1, 2, 4, 8], sealed: true },
      { name: "sealed_tight", input: [2, 4, 6, 1, 3, 5], expected: [1, 2, 3, 4, 5, 6], sealed: true },
    ],
    success: "Scattered allocations now merge at one readable locus.",
  },
  3: {
    title: "Reverse the overflow direction",
    requirement: "Reverse the copied list in place. Swap mirrored positions without shortcuts.",
    example: "Example: [1, 2, 3, 4] becomes [4, 3, 2, 1].",
    starter: `def solve(values):
    reversed_values = values[:]
    for i in range(len(reversed_values) / 2):
        # TODO: swap position i with its mirrored position
    return reversed_values`,
    hints: [
      "The position mirrored across the list is len(reversed_values) - 1 - i.",
      "Replace the TODO with: reversed_values[i], reversed_values[len(reversed_values) - 1 - i] = reversed_values[len(reversed_values) - 1 - i], reversed_values[i]",
    ],
    cases: [
      { name: "visible_odd", input: [1, 2, 3, 4, 5], expected: [5, 4, 3, 2, 1], sealed: false },
      { name: "visible_even", input: [8, 6, 4, 2], expected: [2, 4, 6, 8], sealed: false },
      { name: "sealed_single", input: [9], expected: [9], sealed: true },
      { name: "sealed_symbols", input: [-2, 0, 7, 7, 3, 1], expected: [1, 3, 7, 7, 0, -2], sealed: true },
    ],
    success: "The overflow spiral is now clockwise and leaves one stable spoke.",
  },
};
