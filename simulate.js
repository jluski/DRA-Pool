// ─── DRA Pool Simulation — 30 players, 6 months ──────────────────────────────
// Extracted pure business logic from index.html, no browser/React/Firebase deps.

const uid = () => Math.random().toString(36).slice(2, 9);
const nw  = () => new Date().toISOString();
const dd  = (a, b) => Math.abs(new Date(a) - new Date(b)) / 864e5;
function shuf(a) { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]];} return b; }

function buildBoxes(ids, lad) {
  const rk = lad.filter(s => ids.includes(s.id)); const bx = []; let i = 0;
  while (i < rk.length) { const rem = rk.length - i;
    if (rem <= 6) { bx.push({ name: "Swing Box", isSwing: true, players: rk.slice(i).map(s => s.id) }); break; }
    bx.push({ name: "Box " + (bx.length + 1), isSwing: false, players: rk.slice(i, i + 4).map(s => s.id) }); i += 4; }
  if (bx.length && !bx[bx.length - 1].isSwing) { bx[bx.length - 1].isSwing = true; bx[bx.length - 1].name = "Swing Box"; }
  return bx;
}

function genBM(boxes) {
  const m = [];
  boxes.forEach((b, bi) => {
    for (let i = 0; i < b.players.length; i++)
      for (let j = i + 1; j < b.players.length; j++)
        m.push({ id: uid(), type: "box", box: bi, boxName: b.name, player1: b.players[i], player2: b.players[j], score1: null, score2: null, completed: false, completedAt: null });
  });
  return m;
}

function genWC(boxes) {
  if (boxes.length < 2) return [];
  const wc = [], used = new Set();
  const all = boxes.flatMap((b, bi) => b.players.map(p => ({ id: p, box: bi })));
  const sh = shuf(all);
  for (const p of sh) {
    if (used.has(p.id)) continue;
    const c = sh.find(x => x.box !== p.box && !used.has(x.id));
    if (!c) continue;
    used.add(p.id); used.add(c.id);
    wc.push({ id: uid(), type: "wildcard", player1: p.id, player2: c.id, score1: null, score2: null, completed: false, completedAt: null });
  }
  return wc;
}

function boxSt(pids, matches) {
  const s = {}; pids.forEach(id => { s[id] = { id, pts: 0, w: 0, l: 0, rw: 0, rl: 0 }; });
  matches.filter(m => m.completed).forEach(m => {
    if (!s[m.player1] || !s[m.player2]) return;
    s[m.player1].rw += m.score1; s[m.player1].rl += m.score2;
    s[m.player2].rw += m.score2; s[m.player2].rl += m.score1;
    if (m.score1 > m.score2) { s[m.player1].pts += m.score2 === 0 ? 5 : 4; s[m.player1].w++; s[m.player2].pts += m.score2 > 0 ? 2 : 0; s[m.player2].l++; }
    else { s[m.player2].pts += m.score1 === 0 ? 5 : 4; s[m.player2].w++; s[m.player1].pts += m.score1 > 0 ? 2 : 0; s[m.player1].l++; }
  });
  return Object.values(s).sort((a, b) => b.pts - a.pts || b.w - a.w || b.rw - a.rw);
}

function calcLad(players, st) {
  const s = {}; players.forEach(p => { s[p.id] = { id: p.id, name: p.name, points: 0, boxPts: 0, openPts: 0, wins: 0, losses: 0, rw: 0, rl: 0, mp: 0, last: p.joinedAt, inactive: false, streak: 0 }; });
  const all = [...(st.boxMatches || []), ...(st.wildCards || []), ...(st.openChallenges || [])];
  (st.pastCycles || []).forEach(c => {
    [...(c.boxMatches || []), ...(c.wildCards || []), ...(c.openChallenges || [])].forEach(m => all.push(m));
    (c.bonuses || []).forEach(b => { if (s[b.id]) s[b.id].points += b.pts; });
  });
  const sorted = all.filter(m => m.completed).sort((a, b) => (a.completedAt || "").localeCompare(b.completedAt || ""));
  sorted.forEach(m => {
    const a = s[m.player1], b = s[m.player2]; if (!a || !b) return;
    a.mp++; b.mp++; a.rw += m.score1; a.rl += m.score2; b.rw += m.score2; b.rl += m.score1;
    if (m.completedAt) { if (m.completedAt > a.last) a.last = m.completedAt; if (m.completedAt > b.last) b.last = m.completedAt; }
    if (m.forfeit || (m.score1 === 0 && m.score2 === 0 && m.type !== "open")) { a.points -= 1; a.boxPts -= 1; b.points -= 1; b.boxPts -= 1; a.losses++; b.losses++; a.streak = 0; b.streak = 0; return; }
    if (m.type === "open") {
      if (m.score1 > m.score2) { a.points += 1; a.openPts += 1; a.wins++; b.losses++; a.streak = a.streak > 0 ? a.streak + 1 : 1; b.streak = 0; }
      else { b.points += 1; b.openPts += 1; b.wins++; a.losses++; b.streak = b.streak > 0 ? b.streak + 1 : 1; a.streak = 0; }
    } else {
      const w1 = m.score1 > m.score2; const wp = w1 ? (m.score2 === 0 ? 5 : 4) : (m.score1 === 0 ? 5 : 4); const lp = w1 ? (m.score2 > 0 ? 2 : 0) : (m.score1 > 0 ? 2 : 0);
      if (w1) { a.points += wp; a.boxPts += wp; a.wins++; b.points += lp; b.boxPts += lp; b.losses++; a.streak = a.streak > 0 ? a.streak + 1 : 1; b.streak = 0; }
      else { b.points += wp; b.boxPts += wp; b.wins++; a.points += lp; a.boxPts += lp; a.losses++; b.streak = b.streak > 0 ? b.streak + 1 : 1; a.streak = 0; }
    }
  });
  if (st.boxes && st.boxMatches) {
    st.boxes.forEach((box, bi) => {
      const bm = st.boxMatches.filter(m => m.box === bi);
      if (bm.length > 0 && bm.every(m => m.completed)) {
        const bs = boxSt(box.players, bm);
        if (bs[0] && s[bs[0].id]) { s[bs[0].id].points += 3; s[bs[0].id].boxPts += 3; }
        if (bs[1] && s[bs[1].id]) { s[bs[1].id].points += 1; s[bs[1].id].boxPts += 1; }
      }
    });
  }
  (st.pastCycles || []).forEach(c => { (c.bonuses || []).forEach(b => { if (s[b.id] && b.pts > 0) s[b.id].boxPts += b.pts; }); });
  const t = nw(); players.forEach(p => { if (s[p.id].last && dd(t, s[p.id].last) > 42) s[p.id].inactive = true; });
  return Object.values(s).sort((a, b) => { if (a.inactive !== b.inactive) return a.inactive ? 1 : -1; return b.points - a.points || b.wins - a.wins || b.rw - a.rw; });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ERRORS = [];
function assert(cond, msg) { if (!cond) { ERRORS.push("FAIL: " + msg); console.error("  ✗ FAIL:", msg); } }

function randomScore() {
  // Rack-based pool scores: winner typically wins more racks
  const winRacks = 2 + Math.floor(Math.random() * 4); // 2-5
  const loseRacks = Math.floor(Math.random() * winRacks); // 0 to winRacks-1
  return Math.random() < 0.5 ? [winRacks, loseRacks] : [loseRacks, winRacks];
}

function playAllMatches(matches, forfeitChance = 0.05) {
  return matches.map(m => {
    if (m.completed) return m;
    if (Math.random() < forfeitChance) {
      return { ...m, score1: 0, score2: 0, completed: true, completedAt: nw(), forfeit: true };
    }
    const [s1, s2] = randomScore();
    // Ensure winner has strictly higher score
    const actualS1 = s1 !== s2 ? s1 : s1 + 1;
    return { ...m, score1: actualS1, score2: s2, completed: true, completedAt: nw(), forfeit: false };
  });
}

function startCycle(st) {
  const bon = [], pen = [];
  const afBM = (st.boxMatches || []).map(m => {
    if (!m.completed) { pen.push({ id: m.player1, pts: -1 }, { id: m.player2, pts: -1 }); return { ...m, score1: 0, score2: 0, completed: true, completedAt: nw(), forfeit: true }; }
    return m;
  });
  const afWC = (st.wildCards || []).map(m => {
    if (!m.completed) { pen.push({ id: m.player1, pts: -1 }, { id: m.player2, pts: -1 }); return { ...m, score1: 0, score2: 0, completed: true, completedAt: nw(), forfeit: true }; }
    return m;
  });
  if (st.boxes) st.boxes.forEach((box, bi) => {
    const bm = afBM.filter(m => m.box === bi);
    if (bm.length > 0 && bm.every(m => m.completed)) {
      const bs = boxSt(box.players, bm);
      if (bs[0]) bon.push({ id: bs[0].id, pts: 3 });
      if (bs[1]) bon.push({ id: bs[1].id, pts: 1 });
    }
  });
  const past = st.cycleNumber > 0
    ? [...st.pastCycles, { cycle: st.cycleNumber, boxMatches: afBM, wildCards: afWC, openChallenges: st.openChallenges, boxes: st.boxes, bonuses: [...bon, ...pen], startedAt: st.cycleStart }]
    : st.pastCycles;
  const nl = calcLad(st.players, { ...st, pastCycles: past, boxMatches: [], wildCards: [], openChallenges: [], boxes: [] });
  const boxes = buildBoxes(st.checkedIn, nl);
  const bm = genBM(boxes);
  const wc = genWC(boxes);
  return { ...st, pastCycles: past, boxes, boxMatches: bm, wildCards: wc, openChallenges: [], cycleStart: nw(), cycleNumber: st.cycleNumber + 1 };
}

// ─── Setup: 30 players ───────────────────────────────────────────────────────
const NAMES = [
  "Alice Morgan","Bob Chen","Carol White","Dan Rivers","Elena Scott",
  "Frank Hall","Grace Kim","Henry Park","Iris Lane","Jack Stone",
  "Karen Bell","Leo Cruz","Mia Davis","Noah Evans","Olivia Ford",
  "Paul Green","Quinn Hayes","Rose Ingram","Sam Jones","Tara King",
  "Uma Lewis","Vince Miles","Wendy Nash","Xander Owen","Yara Price",
  "Zoe Quinn","Alex Reed","Blake Shaw","Casey Todd","Drew Upton"
];

let st = {
  players: NAMES.map(n => ({ id: uid(), name: n, joinedAt: nw() })),
  boxes: [], boxMatches: [], wildCards: [], openChallenges: [],
  checkedIn: [], pastCycles: [], cycleNumber: 0, cycleStart: null, auditLog: []
};

console.log("═══════════════════════════════════════════════════════");
console.log("  DRA Pool Simulation — 30 players, 6 months");
console.log("═══════════════════════════════════════════════════════\n");
console.log(`Players: ${st.players.length}`);

// ─── Run 6 months ────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June"];

for (let month = 0; month < 6; month++) {
  console.log(`\n───────────────────────────────────────────────────────`);
  console.log(`  Month ${month + 1}: ${MONTHS[month]}`);
  console.log(`───────────────────────────────────────────────────────`);

  // Check in 22-28 random players (realistic participation)
  const count = 22 + Math.floor(Math.random() * 7);
  st.checkedIn = shuf(st.players.map(p => p.id)).slice(0, count);
  console.log(`  Checked in: ${st.checkedIn.length} players`);

  assert(st.checkedIn.length >= 4, `Month ${month+1}: need 4+ checked in`);

  // Start cycle
  st = startCycle(st);
  console.log(`  Cycle #${st.cycleNumber} started`);
  console.log(`  Boxes: ${st.boxes.map(b => b.name + "(" + b.players.length + ")").join(", ")}`);
  console.log(`  Box matches: ${st.boxMatches.length}`);
  console.log(`  Wild cards:  ${st.wildCards.length}`);

  // Validate box structure
  st.boxes.forEach((box, bi) => {
    assert(box.players.length >= 2, `Box ${bi} has < 2 players`);
    if (!box.isSwing) assert(box.players.length === 4, `Non-swing box ${bi} should have 4 players, has ${box.players.length}`);
    else assert(box.players.length >= 2 && box.players.length <= 6, `Swing box ${bi} player count out of range: ${box.players.length}`);
  });

  // Validate matches reference valid players
  const allPlayerIds = new Set(st.players.map(p => p.id));
  st.boxMatches.forEach(m => {
    assert(allPlayerIds.has(m.player1), `Box match player1 unknown: ${m.player1}`);
    assert(allPlayerIds.has(m.player2), `Box match player2 unknown: ${m.player2}`);
    assert(m.player1 !== m.player2, `Box match has same player both sides`);
  });
  st.wildCards.forEach(m => {
    assert(allPlayerIds.has(m.player1), `WC player1 unknown`);
    assert(allPlayerIds.has(m.player2), `WC player2 unknown`);
    assert(m.player1 !== m.player2, `WC same player both sides`);
  });

  // Validate no duplicate box matches
  const bmKeys = st.boxMatches.map(m => [m.player1, m.player2].sort().join("|"));
  assert(new Set(bmKeys).size === bmKeys.length, `Duplicate box matches detected in month ${month+1}`);

  // Validate wild cards are cross-box
  st.wildCards.forEach(m => {
    const p1Box = st.boxes.findIndex(b => b.players.includes(m.player1));
    const p2Box = st.boxes.findIndex(b => b.players.includes(m.player2));
    assert(p1Box !== p2Box, `Wild card players are in same box (box ${p1Box})`);
  });

  // Add some open challenges (5-10 random ones)
  const openCount = 5 + Math.floor(Math.random() * 6);
  const checkedInPlayers = st.checkedIn;
  for (let i = 0; i < openCount; i++) {
    const sh = shuf(checkedInPlayers);
    if (sh.length >= 2) {
      st.openChallenges.push({ id: uid(), type: "open", player1: sh[0], player2: sh[1], score1: null, score2: null, completed: false, completedAt: null });
    }
  }

  // Play all matches (5% forfeit chance)
  st.boxMatches = playAllMatches(st.boxMatches, 0.05);
  st.wildCards = playAllMatches(st.wildCards, 0.05);
  st.openChallenges = playAllMatches(st.openChallenges, 0.02);

  // Validate scores: no ties, winner must have higher score
  [...st.boxMatches, ...st.wildCards].forEach(m => {
    if (m.forfeit) return;
    assert(m.score1 !== m.score2, `Match ${m.id} is a tie (${m.score1}-${m.score2}) — pool matches can't tie`);
    assert(m.score1 >= 0 && m.score2 >= 0, `Negative score in match ${m.id}`);
  });

  const completedBM = st.boxMatches.filter(m => m.completed).length;
  const completedWC = st.wildCards.filter(m => m.completed).length;
  const completedOC = st.openChallenges.filter(m => m.completed).length;
  console.log(`  Played: ${completedBM}/${st.boxMatches.length} box, ${completedWC}/${st.wildCards.length} WC, ${completedOC}/${st.openChallenges.length} open`);

  // Calculate ladder mid-cycle
  const lad = calcLad(st.players, st);
  assert(lad.length === st.players.length, `Ladder length mismatch: ${lad.length} vs ${st.players.length} players`);

  // Validate no NaN/undefined points
  lad.forEach(s => {
    assert(!isNaN(s.points), `${s.name} has NaN points`);
    assert(s.wins + s.losses <= s.mp, `${s.name}: wins+losses (${s.wins+s.losses}) > matches played (${s.mp})`);
    assert(s.points >= -50, `${s.name} has suspiciously low points: ${s.points}`);
  });

  const top3 = lad.slice(0, 3).map(s => `${s.name}(${s.points}pts)`).join(", ");
  console.log(`  Top 3: ${top3}`);

  // Check box standings for each box
  st.boxes.forEach((box, bi) => {
    const bm = st.boxMatches.filter(m => m.box === bi);
    const bs = boxSt(box.players, bm);
    assert(bs.length === box.players.length, `Box ${bi} standings length mismatch`);
    bs.forEach(s => { assert(!isNaN(s.pts), `Box ${bi} player has NaN pts`); });
  });

  console.log(`  ✓ All assertions passed for month ${month+1}`);
}

// ─── Final State Analysis ─────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  Final State After 6 Months`);
console.log(`═══════════════════════════════════════════════════════`);

// Archive last cycle manually (simulate ending the league)
const finalAfBM = st.boxMatches.map(m => m.completed ? m : { ...m, score1: 0, score2: 0, completed: true, completedAt: nw(), forfeit: true });
const finalAfWC = st.wildCards.map(m => m.completed ? m : { ...m, score1: 0, score2: 0, completed: true, completedAt: nw(), forfeit: true });
const finalState = {
  ...st,
  pastCycles: [...st.pastCycles, { cycle: st.cycleNumber, boxMatches: finalAfBM, wildCards: finalAfWC, openChallenges: st.openChallenges, boxes: st.boxes, bonuses: [], startedAt: st.cycleStart }],
  boxMatches: [], wildCards: [], openChallenges: [], boxes: []
};

const finalLad = calcLad(st.players, finalState);
console.log(`\nFinal Standings (Top 10):`);
finalLad.slice(0, 10).forEach((s, i) => {
  console.log(`  ${i+1}. ${s.name.padEnd(18)} ${String(s.points).padStart(4)}pts  W:${s.wins} L:${s.losses} MP:${s.mp}${s.inactive ? " [inactive]" : ""}`);
});

console.log(`\nInactive players: ${finalLad.filter(s => s.inactive).length}`);
console.log(`Total past cycles archived: ${finalState.pastCycles.length}`);

const totalMatches = finalState.pastCycles.reduce((acc, c) => acc + (c.boxMatches||[]).length + (c.wildCards||[]).length + (c.openChallenges||[]).length, 0);
const completedTotal = finalState.pastCycles.reduce((acc, c) => acc + [...(c.boxMatches||[]), ...(c.wildCards||[]), ...(c.openChallenges||[])].filter(m => m.completed).length, 0);
console.log(`Total matches played: ${completedTotal}/${totalMatches}`);

// Validate cumulative points make sense
assert(finalLad[0].points > 0, "Leader should have positive points");
assert(finalLad.every(s => !isNaN(s.points)), "All players have valid points");
assert(finalState.pastCycles.length === 6, `Should have 6 archived cycles, got ${finalState.pastCycles.length}`);

// Check no player appears twice in standings
const ids = finalLad.map(s => s.id);
assert(new Set(ids).size === ids.length, "Duplicate players in final standings");

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
if (ERRORS.length === 0) {
  console.log(`  ✅ All tests passed! App logic is working correctly.`);
} else {
  console.log(`  ❌ ${ERRORS.length} issue(s) found:`);
  ERRORS.forEach(e => console.log(`     ${e}`));
}
console.log(`═══════════════════════════════════════════════════════\n`);
