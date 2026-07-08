from __future__ import annotations

import base64
import html
from pathlib import Path

from .encounters import ENCOUNTERS, Encounter
from .visualizers import TraceEvent, encounter_trace_events

ASSET_DIR = Path(__file__).parent / "assets" / "phase1"
BADGE_SHEET = ASSET_DIR / "encounter-badges.svg"
EVENT_SHEET = ASSET_DIR / "trace-event-kinds.svg"
CERTIFICATION_SHEET = ASSET_DIR / "sorting-certification-markers.svg"

BADGE_CELLS = {
    "sorting_slime": 0,
    "triage_line": 1,
}

EVENT_ICON_CELLS = {
    "comparison": 0,
    "arrival": 1,
    "arrival_empty": 1,
    "urgent_override": 2,
    "stable_tie": 3,
    "ordinary_guard": 4,
    "served": 5,
    "empty": 0,
}


def write_game_shell(output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_game_shell(), encoding="utf-8")
    return output_path


def render_game_shell() -> str:
    badge_sheet_uri = _svg_data_uri(BADGE_SHEET)
    event_sheet_uri = _svg_data_uri(EVENT_SHEET)
    certification_sheet_uri = _svg_data_uri(CERTIFICATION_SHEET)
    encounters = tuple(ENCOUNTERS.values())
    tabs = "\n".join(_tab_button(encounter, index) for index, encounter in enumerate(encounters))
    panels = "\n".join(
        _encounter_panel(encounter, index, badge_sheet_uri, event_sheet_uri, certification_sheet_uri)
        for index, encounter in enumerate(encounters)
    )

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Algorithimia Game Shell</title>
  <style>
    :root {{
      color-scheme: dark;
      --bg: #10151d;
      --surface: #151d27;
      --panel: #1b2633;
      --line: #344255;
      --text: #f8fafc;
      --muted: #aab6c5;
      --gold: #f8c14a;
      --cyan: #38bdf8;
      --green: #39d98a;
      --rose: #ef476f;
      --ink: #0b1017;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font: 16px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    main {{
      width: min(1120px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 24px 0 32px;
    }}
    .topbar {{
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 14px;
      border-bottom: 2px solid var(--line);
    }}
    h1, h2, h3, p {{
      margin: 0;
    }}
    h1 {{
      font-size: clamp(1.6rem, 3vw, 2.35rem);
      line-height: 1.05;
      letter-spacing: 0;
    }}
    .status {{
      color: var(--muted);
      font-size: 0.95rem;
      white-space: nowrap;
    }}
    .tabs {{
      display: flex;
      gap: 8px;
      margin: 18px 0;
      overflow-x: auto;
      padding-bottom: 2px;
    }}
    .tab {{
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--text);
      min-height: 42px;
      padding: 8px 12px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font: inherit;
      flex: 0 0 auto;
    }}
    .tab[aria-selected="true"] {{
      border-color: var(--cyan);
      box-shadow: inset 0 -3px 0 var(--cyan);
    }}
    .panel {{
      display: none;
      grid-template-columns: minmax(0, 1fr) minmax(300px, 0.86fr);
      gap: 18px;
      align-items: start;
    }}
    .panel.active {{
      display: grid;
    }}
    .section {{
      border: 1px solid var(--line);
      background: var(--panel);
      padding: 14px;
      display: grid;
      gap: 12px;
    }}
    .encounter-title {{
      display: flex;
      gap: 10px;
      align-items: center;
    }}
    .badge, .icon {{
      display: inline-block;
      flex: 0 0 auto;
      image-rendering: pixelated;
      background-repeat: no-repeat;
      background-size: auto 32px;
      width: 32px;
      height: 32px;
    }}
    .prompt, .muted {{
      color: var(--muted);
      overflow-wrap: anywhere;
    }}
    .command {{
      display: block;
      margin-top: 6px;
      padding: 8px 10px;
      background: var(--ink);
      border: 1px solid var(--line);
      color: var(--green);
      font: 0.9rem/1.35 ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }}
    .cert {{
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 10px;
      align-items: center;
      border-left: 5px solid var(--gold);
      padding: 10px;
      background: var(--surface);
    }}
    .trace {{
      display: grid;
      gap: 8px;
    }}
    .event {{
      min-height: 52px;
      display: grid;
      grid-template-columns: 32px minmax(0, 1fr);
      gap: 10px;
      align-items: center;
      border: 1px solid var(--line);
      border-left: 5px solid var(--cyan);
      background: var(--surface);
      padding: 9px 10px;
    }}
    .event[data-kind="urgent_override"], .event[data-kind="ordinary_guard"] {{
      border-left-color: var(--rose);
    }}
    .event[data-kind="stable_tie"] {{
      border-left-color: var(--gold);
    }}
    .event[data-kind="served"] {{
      border-left-color: var(--green);
    }}
    .label {{
      font-weight: 650;
      overflow-wrap: anywhere;
    }}
    .payload {{
      color: var(--muted);
      font: 0.82rem/1.35 ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }}
    @media (max-width: 760px) {{
      main {{
        width: min(100vw - 20px, 1120px);
        padding-top: 14px;
      }}
      .topbar {{
        display: grid;
      }}
      .status {{
        white-space: normal;
      }}
      .panel.active {{
        display: grid;
        grid-template-columns: 1fr;
      }}
    }}
  </style>
</head>
<body>
  <main>
    <header class="topbar">
      <h1>Algorithimia</h1>
      <div class="status">Python prototype shell - code execution stays in the local CLI</div>
    </header>
    <nav class="tabs" role="tablist" aria-label="Encounters">
{tabs}
    </nav>
{panels}
  </main>
  <script>
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
    function selectTab(tab) {{
      tabs.forEach((candidate) => candidate.setAttribute('aria-selected', String(candidate === tab)));
      panels.forEach((panel) => panel.classList.toggle('active', panel.id === tab.getAttribute('aria-controls')));
    }}
    tabs.forEach((tab) => tab.addEventListener('click', () => selectTab(tab)));
  </script>
</body>
</html>
"""


def _tab_button(encounter: Encounter, index: int) -> str:
    selected = "true" if index == 0 else "false"
    return (
        f'      <button class="tab" id="tab-{html.escape(encounter.slug)}" role="tab" '
        f'aria-selected="{selected}" aria-controls="panel-{html.escape(encounter.slug)}">'
        f"{html.escape(encounter.title)}</button>"
    )


def _encounter_panel(
    encounter: Encounter,
    index: int,
    badge_sheet_uri: str,
    event_sheet_uri: str,
    certification_sheet_uri: str,
) -> str:
    active = " active" if index == 0 else ""
    badge_cell = BADGE_CELLS.get(encounter.slug, 0)
    trace_events = "\n".join(_event_row(event, event_sheet_uri) for event in encounter_trace_events(encounter))
    certification = _certification_block(encounter, certification_sheet_uri)
    encounter_flag = "" if encounter.slug == "sorting_slime" else f" --encounter {encounter.slug}"
    trace_path = "build\\game-trace.html" if encounter.slug == "sorting_slime" else f"build\\{encounter.slug}-trace.html"

    return f"""    <section class="panel{active}" id="panel-{html.escape(encounter.slug)}" role="tabpanel" aria-labelledby="tab-{html.escape(encounter.slug)}">
      <div class="section">
        <div class="encounter-title">
          <span class="badge" aria-hidden="true" style="background-image: url(&quot;{badge_sheet_uri}&quot;); background-position: -{badge_cell * 32}px 0"></span>
          <div>
            <h2>{html.escape(encounter.title)}</h2>
            <p class="muted">{html.escape(encounter.slug)}</p>
          </div>
        </div>
        <p class="prompt">{html.escape(encounter.prompt)}</p>
{certification}
        <div>
          <h3>Run locally</h3>
          <code class="command">python -m algorithimia{html.escape(encounter_flag)}</code>
          <code class="command">python -m algorithimia{html.escape(encounter_flag)} --trace-html {html.escape(trace_path)}</code>
        </div>
      </div>
      <div class="section">
        <h3>Trace Preview</h3>
        <div class="trace" aria-label="{html.escape(encounter.title)} trace events">
{trace_events}
        </div>
      </div>
    </section>"""


def _event_row(event: TraceEvent, sheet_uri: str) -> str:
    cell = EVENT_ICON_CELLS.get(event.kind, 0)
    payload = " ".join(f"{key}={value!r}" for key, value in event.payload.items())
    return f"""          <article class="event" data-kind="{html.escape(event.kind)}">
            <span class="icon" aria-hidden="true" style="background-image: url(&quot;{sheet_uri}&quot;); background-position: -{cell * 32}px 0"></span>
            <div>
              <div class="label">{html.escape(event.label)}</div>
              <div class="payload">{html.escape(payload)}</div>
            </div>
          </article>"""


def _certification_block(encounter: Encounter, sheet_uri: str) -> str:
    certification_count = len(encounter.certification_cases)
    if certification_count == 0:
        return ""

    return f"""        <div class="cert">
          <span class="icon" aria-hidden="true" style="background-image: url(&quot;{sheet_uri}&quot;); background-position: -32px 0"></span>
          <div>
            <strong>Sealed certification active</strong>
            <p class="muted">{len(encounter.cases)} public teaching cases and {certification_count} sealed checks. Hidden inputs stay sealed.</p>
          </div>
        </div>"""


def _svg_data_uri(path: Path) -> str:
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"
