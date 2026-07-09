// Mirrors algorithimia/encounters.py TRIAGE_LINE.default_solution: urgent tickets
// may advance, equal-urgency ties keep arrival order, and after two urgent
// services in a row the oldest waiting ordinary ticket must be served next.

export function solveTriageOrder(tickets) {
  const waiting = tickets.slice().sort((a, b) => a.arrival - b.arrival);
  const served = [];
  let urgentStreak = 0;

  while (waiting.length) {
    const ordinary = waiting.filter((t) => !t.urgent);
    let chosen;
    if (urgentStreak >= 2 && ordinary.length) {
      chosen = ordinary[0];
      urgentStreak = 0;
    } else {
      const urgent = waiting.filter((t) => t.urgent);
      if (urgent.length) {
        chosen = urgent[0];
        urgentStreak += 1;
      } else {
        chosen = waiting[0];
        urgentStreak = 0;
      }
    }
    served.push(chosen.id);
    waiting.splice(waiting.indexOf(chosen), 1);
  }
  return served;
}

export function ticketsEqual(order, tickets) {
  const expected = solveTriageOrder(tickets).join(",");
  return order.join(",") === expected;
}
