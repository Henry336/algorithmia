import ast
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


def extract_js_array(source, marker):
    start = source.index(marker)
    bracket = source.index("[", start)
    depth = 0
    for index in range(bracket, len(source)):
        char = source[index]
        if char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                return source[bracket:index + 1]
    raise ValueError(f"Could not find array for {marker}")


def load_room_maps(filename):
    source = (ROOT / "web" / "js" / filename).read_text(encoding="utf-8")
    return ast.literal_eval(extract_js_array(source, "const ROOM_MAPS"))


def positions(board, code):
    return [(col, row) for row, line in enumerate(board) for col, value in enumerate(line) if value == code]


def flood(board, start, blocking):
    width = len(board[0])
    height = len(board)
    seen = {start}
    queue = [start]
    while queue:
        col, row = queue.pop(0)
        for dc, dr in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            next_pos = (col + dc, row + dr)
            next_col, next_row = next_pos
            if next_pos in seen:
                continue
            if next_row < 0 or next_row >= height or next_col < 0 or next_col >= width:
                continue
            if board[next_row][next_col] in blocking:
                continue
            seen.add(next_pos)
            queue.append(next_pos)
    return seen


def is_adjacent_to(reachable, target):
    col, row = target
    return any((col + dc, row + dr) in reachable for dc, dr in ((0, -1), (0, 1), (-1, 0), (1, 0)))


def clear_codes(board, *codes):
    next_board = [row[:] for row in board]
    for row in range(len(next_board)):
        for col in range(len(next_board[row])):
            if next_board[row][col] in codes:
                next_board[row][col] = 0
    return next_board


class WebRoomMapContracts(unittest.TestCase):
    def test_sorting_slime_phaser_entry_points_are_packaged(self):
        html = (ROOT / "web" / "index.html").read_text(encoding="utf-8")
        battle = (ROOT / "web" / "js" / "battle.js").read_text(encoding="utf-8")
        engine = (ROOT / "web" / "js" / "slimeArenaEngine.js").read_text(encoding="utf-8")

        self.assertIn('src="vendor/phaser.min.js"', html)
        self.assertIn('id="slime-arena-host"', html)
        self.assertIn('data-action="arcade"', html)
        self.assertIn('data-arcade-encounter="sorting-slime"', html)
        self.assertIn("startSortingSlimeArenaBattle", battle)
        self.assertIn("new Phaser.Game", engine)
        self.assertIn("spawnColumn", engine)
        self.assertIn("spawnMergeBurst", engine)
        self.assertIn("spawnSpiralBurst", engine)
        self.assertIn("NULL_SHIELD_MAX = 100", engine)
        self.assertIn("GUARD_DURATION = 5000", engine)
        self.assertNotIn("openAccess", engine)

    def assert_all_targets_interactable(self, board, start, blocking, target_code, label):
        reachable = flood(board, start, blocking)
        targets = positions(board, target_code)
        self.assertTrue(targets, f"{label} target code {target_code} is missing")
        unreachable = [pos for pos in targets if not is_adjacent_to(reachable, pos)]
        self.assertEqual([], unreachable, f"{label} has unreachable interaction targets")

    def test_chapter_maps_keep_expected_dimensions(self):
        for filename in ("chapter2.js", "chapter3.js", "chapter4.js"):
            with self.subTest(filename=filename):
                maps = load_room_maps(filename)
                for index, board in enumerate(maps):
                    self.assertEqual(10, len(board), f"{filename} room {index} row count")
                    self.assertTrue(all(len(row) == 13 for row in board), f"{filename} room {index} column count")

    def test_heaplight_core_required_interactions_and_boss_gate_are_reachable(self):
        board = load_room_maps("chapter2.js")[1]
        blocking = {1, 2, 3, 8, 10, 14, 17, 19, 20, 5, 7, 9, 11, 16}
        start = (6, 8)
        self.assert_all_targets_interactable(board, start, blocking, 11, "Heaplight core Heat Sifter")
        self.assert_all_targets_interactable(board, start, blocking, 14, "Heaplight core valves")

        opened = clear_codes(board, 11)
        opened[4][12] = 6
        reachable = flood(opened, start, blocking - {3})
        self.assertIn((12, 4), reachable, "Heaplight boss gate should be reachable after core clear")

    def test_array_court_required_interactions_and_boss_gate_are_reachable(self):
        board = load_room_maps("chapter3.js")[1]
        blocking = {1, 2, 3, 8, 10, 14, 17, 19, 20, 21, 5, 7, 9, 11, 16}
        start = (6, 8)
        self.assert_all_targets_interactable(board, start, blocking, 11, "Array court Null Echo")
        self.assert_all_targets_interactable(board, start, blocking, 14, "Array court mirrors")
        self.assertIn((6, 9), flood(board, start, blocking), "Array court return door should be reachable")

        opened = clear_codes(board, 11)
        opened[4][12] = 6
        reachable = flood(opened, start, blocking - {3})
        self.assertIn((12, 4), reachable, "Array court boss gate should be reachable after echo and mirrors")

    def test_array_bogolord_room_boss_and_exit_are_reachable(self):
        board = load_room_maps("chapter3.js")[3]
        blocking = {1, 2, 3, 8, 10, 14, 17, 19, 20, 21, 5, 7, 9, 11, 16}
        start = (1, 5)
        self.assert_all_targets_interactable(board, start, blocking, 9, "Bogolord room boss")
        self.assertIn((0, 5), flood(board, start, blocking), "Bogolord room return door should be reachable")

        opened = clear_codes(board, 9)
        opened[0][5] = 6
        opened[0][6] = 6
        opened[0][7] = 6
        reachable = flood(opened, start, blocking - {3})
        self.assertTrue(
            {(5, 0), (6, 0), (7, 0)} & reachable,
            "Bogolord room north exit should be reachable after boss defeat",
        )

    def test_graphreach_crossing_required_interactions_and_boss_gate_are_reachable(self):
        board = load_room_maps("chapter4.js")[1]
        blocking = {1, 2, 3, 8, 10, 14, 17, 19, 20, 21, 22, 5, 7, 9, 11, 24, 25}
        start = (6, 8)
        self.assert_all_targets_interactable(board, start, blocking, 24, "Graphreach Recursive Husk mini-boss")
        self.assertIn((6, 9), flood(board, start, blocking), "Graphreach return door should be reachable")

        opened = clear_codes(board, 24)
        self.assert_all_targets_interactable(opened, start, blocking, 14, "Graphreach anchors after mini-boss")
        opened[4][12] = 6
        reachable = flood(opened, start, blocking - {3})
        self.assertIn((12, 4), reachable, "Graphreach boss gate should be reachable after anchors")

    def test_graphreach_secret_room_secret_boss_is_reachable(self):
        board = load_room_maps("chapter4.js")[4]
        blocking = {1, 2, 3, 8, 10, 14, 17, 19, 20, 21, 22, 5, 7, 9, 11, 24, 25}
        start = (11, 5)
        self.assert_all_targets_interactable(board, start, blocking, 25, "Graphreach secret boss")
        self.assertIn((11, 5), flood(board, start, blocking), "Graphreach secret-room return should be reachable")


if __name__ == "__main__":
    unittest.main()
