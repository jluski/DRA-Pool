# DRA Pool League — Features & Methodology

A real-time, cloud-based competitive 9-ball pool league management system for DRA Advisors. Players compete in structured boxes each round, earn points, and climb an office-wide ladder.

---

## Table of Contents

1. [League Format](#1-league-format)
2. [Scoring System](#2-scoring-system)
3. [Tiebreaker Logic](#3-tiebreaker-logic)
4. [ELO Rating System](#4-elo-rating-system)
5. [Seeding & Promotion/Relegation](#5-seeding--promotiondemotion)
6. [Player Statistics & Standings](#6-player-statistics--standings)
7. [Admin Features](#7-admin-features)
8. [Player Features](#8-player-features)
9. [Navigation & Views](#9-navigation--views)
10. [Data, History & Exports](#10-data-history--exports)

---

## 1. League Format

### Rounds (Cycles)
- The league runs in recurring rounds (default **4 weeks** per round, configurable from 1–12 weeks).
- At the start of each round, players check in to declare participation.
- Checked-in players are seeded into **boxes** of 4. The final group (≤ 6 players) becomes the **Swing Box**.
- Each round generates three categories of matches: Box Matches, Wild Cards, and Open Challenges.

### Box Matches
- Within each box, every player faces every other player once — a **round-robin** of 6 matches per 4-player box.
- Format: best-of-3 games (first to win 2 games wins the match).
- Completing all box matches determines 1st and 2nd place finishers, who receive end-of-round bonuses.

### Wild Cards
- Each player receives **one cross-box match** per round, randomly assigned against a player from a different box.
- Same scoring rules as Box Matches (best of 3).
- Players from the Swing Box are included in wild card pairing.

### Open Challenges
- Any player can challenge any other player at any time — **unlimited per round**.
- Single game (not best of 3); winner earns 2 points.
- No penalty for a loss.
- Not subject to end-of-round box bonuses.

### Check-In
- Players opt in before each round starts.
- Only checked-in players are seeded into boxes.
- Players not checked in are excluded from that round's box matches and wild cards but may still participate in open challenges if previously enrolled.

### Swing Box
- The Swing Box is the final box containing 2–6 players (whoever is left after filling 4-player boxes).
- New players and returning players enter via the Swing Box.
- The Swing Box follows the same round-robin and scoring rules as regular boxes.

---

## 2. Scoring System

### Box & Wild Card Matches (Best of 3)

| Result | Winner Points | Loser Points |
|---|---|---|
| 2–0 (shutout) | **+5** | 0 |
| 2–1 | **+4** | +2 |

> A shutout (opponent wins zero games) earns the winner an extra point as a bonus for dominant performance.

### End-of-Round Box Bonuses

| Finish | Bonus Points |
|---|---|
| 1st place in box | **+3** |
| 2nd place in box | **+1** |

Box finish is determined by points earned within the box during that round. Bonuses are awarded at round end when all box matches are complete (including auto-forfeits for unplayed matches).

### Open Challenges

| Result | Points |
|---|---|
| Win | **+2** |
| Loss | 0 |

### Forfeits

If a Box or Wild Card match is not completed by round end, it is auto-forfeited: **both players receive –1 point**.

### Points Summary

| Action | Points |
|---|---|
| Box/WC shutout win (2–0) | +5 |
| Box/WC win (2–1) | +4 |
| Box/WC loss after winning a game (1–2) | +2 |
| Box/WC shutout loss (0–2) | 0 |
| 1st place in box (end-of-round) | +3 |
| 2nd place in box (end-of-round) | +1 |
| Open Challenge win | +2 |
| Open Challenge loss | 0 |
| Forfeit (both players) | –1 |

---

## 3. Tiebreaker Logic

When two or more players are tied on total points in the ladder standings, the following criteria are applied in order:

| Priority | Criterion |
|---|---|
| 1 | Active players rank above inactive players |
| 2 | Total points (higher is better) |
| 3 | Head-to-head record vs. the tied opponent(s) |
| 4 | Total wins (higher is better) |
| 5 | Total racks won (higher is better) |

> ELO rating is **not** used as a standings tiebreaker — it is only used as a fractional adjustment in seeding (see Section 5).

---

## 4. ELO Rating System

ELO is a skill-tracking rating that adjusts after every match based on the expected vs. actual outcome. It provides a secondary view of player skill independent of the points-based ladder.

### Base Parameters

| Parameter | Value |
|---|---|
| Starting rating | 1000 |
| Provisional threshold | 8 matches played |
| ELO display minimum | 3 matches played |

### K-Factors (Rating Sensitivity)

| Match Type | K-Factor |
|---|---|
| Box match | 32 |
| Wild Card match | 24 |
| Open Challenge | 16 |
| Provisional (< 8 matches) | 48 |

Higher K-factors mean ratings change more per match. Provisional players (fewer than 8 matches) use K=48 so their rating converges quickly to an accurate level. Open Challenges use a lower K=16 since they carry less competitive weight.

### Score-Margin Weighting

Unlike a standard binary ELO (win=1, loss=0), DRA Pool uses **score-margin weighting**: the match result is calculated as `racks won / total racks played`. A 2–0 shutout (e.g., 2 racks for, 0 against) counts as a result of `1.0` for the winner; a 2–1 win counts as `0.667`. This rewards dominant performances with larger ELO gains.

### ELO Formula

```
Expected score (Ea) = 1 / (1 + 10^((Rb - Ra) / 400))
ELO delta (Da)      = K × (actual result − Ea)
```

### ELO in Practice

- ELO is displayed on a player's ladder row after they have played **3 or more matches**.
- Each player's match history shows the ELO delta per match (e.g., +12, –7).
- The in-round ELO change is shown on the ladder (current round vs. previous round).
- ELO rank (separate from points rank) is shown on the player card.
- ELO is used in seeding as a fractional tiebreaker only (see Section 5).
- Forfeited matches do **not** affect ELO.

---

## 5. Seeding & Promotion/Demotion

### How Boxes Are Built

At the start of each round:

1. The ladder is recalculated including all completed matches and past-round bonuses.
2. Checked-in players are sorted by ladder rank (highest points first).
3. Players are placed into boxes top-down: **top 4 ranked → Box 1**, next 4 → Box 2, and so on.
4. If the remaining checked-in count is **≤ 6**, all remaining players go into the **Swing Box**.
5. New or absent players (not in the previous round's boxes) are always placed in the Swing Box regardless of ladder rank.

### ELO as Fractional Seeding Adjustment

To prevent rigid "slots" and add nuance, ELO is used as a small fractional adjustment to seeding position:

- Each player's seeding score = `ladder position + ELO adjustment (0.00–0.99)`
- Players with higher ELO receive a fractional bonus that improves their seeding within their tier.
- The fractional range (< 1.0) means **ELO alone can never bump a player across a full box boundary** — it only acts as a tiebreaker between players at the same ladder level.
- Players with fewer than 3 matches played are excluded from ELO-based seeding adjustment (they use pure ladder rank).

### Promotion & Relegation

- There is no explicit promotion/relegation mechanic — it is implicit in the ladder.
- Win matches and earn points → climb the ladder → earn a higher box assignment next round.
- Lose matches or go inactive → fall in the standings → placed in a lower box next round.
- A strong 1st-place finish in a low box is worth more points than a 4th-place finish in a high box, naturally enabling upward mobility.

### Admin Box Adjustments

Before confirming a round, admins can:
- Drag and drop players between boxes in the preview.
- Randomize all box assignments (ignores ladder seeding entirely).
- View seeding reasons per player (previous box position, ELO, points).

---

## 6. Player Statistics & Standings

### Tracked Stats Per Player

| Stat | Description |
|---|---|
| **Points** | Total cumulative points (all match types + bonuses) |
| **Box Points** | Points from Box and Wild Card matches + bonuses only |
| **Open Points** | Points from Open Challenges only |
| **Wins** | Total match wins |
| **Losses** | Total match losses |
| **Matches Played** | Total completed matches |
| **Racks Won** | Total individual games/racks won |
| **Racks Lost** | Total individual games/racks lost |
| **Win Streak** | Current consecutive win streak |
| **Last Active** | Date of most recent completed match |
| **Inactive** | `true` if no match in 42+ days |
| **ELO Rating** | Calculated rating (shown after 3 matches) |

### Inactivity

- A player is marked **inactive** if their most recent completed match was more than **42 days ago**.
- Inactive players are sorted to the bottom of the standings.
- Inactivity is cleared automatically when the player completes a new match.

### Season Awards (Home View)

The home screen displays live recognition for:

| Award | Criterion |
|---|---|
| Most Wins | Highest total wins |
| Highest ELO | Best ELO rating (3+ matches played) |
| Hot Streak | Longest current consecutive win streak |
| Shutout King | Most 2–0 shutout wins |
| Iron Man | Most total matches played |

---

## 7. Admin Features

All admin actions are PIN-protected (4-digit PIN).

### Round Management

- **Preview Boxes**: Generate suggested box assignments before committing to a round start. Shows each player's seeding reason (previous rank, ELO, points).
- **Confirm & Start Round**: Lock in box assignments and generate all Box Match and Wild Card pairings.
- **Manual Box Adjustment**: Drag-and-drop players between boxes in the preview screen. Moved players are flagged with a MOVED badge.
- **Randomize Round**: Ignore seeding entirely and randomly assign checked-in players to boxes.
- **End Round Early**: Manually close the active round; unplayed matches are auto-forfeited (–1 pt each player).
- **Complete Cycle**: Archive the current round, apply bonuses, and ready the system for the next round.
- **Undo Last Round**: Roll back to the previous round's state.
- **Full Reset**: Wipe all data and return to the default state.

### Player Management

- **Add Player**: Register a new player by name.
- **Remove Player**: Delete a player from the league.
- **Manage Check-Ins**: Add or remove players from the current round's check-in list.
- **Auto Check-In from Previous Round**: One-click to pre-populate check-ins from last round's participants.

### Match Management

- **Log Match Result**: Enter scores for any Box, Wild Card, or Open Challenge match.
- **Edit Score**: Correct a previously logged result.
- **Forfeit Match**: Mark a match as not played (–1 pt each player).

### League Settings

- **Round Duration**: Set weeks per round (1–12, default 4).
- **Admin PIN**: Change the admin PIN.
- **Announcement Banner**: Set a message displayed to all players at the top of the app.

### Audit Log

- Tracks the last **200 actions** with timestamps and details.
- Searchable by keyword.
- Records all admin actions: round starts/ends, match results, player additions, forfeits, etc.

### Exports

- **Export JSON**: Full league state backup (all players, matches, rounds, history).
- **Export CSV**: Current standings with Rank, Name, Points, Box Pts, Open Pts, Wins, Losses, Racks Won, Racks Lost, ELO.

---

## 8. Player Features

Non-admin players can:

- **View Standings**: See the full ladder with points, box points, open points, wins, losses.
- **Check In / Check Out**: Toggle participation for the upcoming round.
- **View Boxes**: See box assignments and all round-robin pairings for the current round.
- **View Matches**: Browse pending and completed Box, Wild Card, and Open Challenge matches.
- **Create Open Challenges**: Challenge any player (or be challenged) for 2 points.
- **View Player Cards**: Tap any player's name to see their full match history, ELO history, win rate, stats, and box history.
- **View Rules**: In-app league rules and house rules for 9-ball.
- **View Past Cycles**: Browse archived rounds with full standings, match logs, and bonus breakdowns.
- **Spectator Mode**: Access `?mode=spectator` in the URL for a read-only view (no check-in or challenge creation).
- **Pull-to-Refresh**: Drag down on mobile to force a data sync.
- **Real-Time Updates**: All data syncs live via Firebase — no page reload needed.

---

## 9. Navigation & Views

| Tab | Icon | Description |
|---|---|---|
| **Home** | 🏆 | Ladder standings, round progress, champion history, season awards |
| **Boxes** | 📊 | Current box assignments and round-robin match grid |
| **Matches** | 🎱 | Log and view Box, Wild Card, and Open Challenge matches |
| **Challenge** | ⚔️ | Create a new Open Challenge between any two players |
| **Check-In** | ✅ | Join or leave the current round; search players |
| **Rules** | 📖 | League format, scoring guide, and DRA house rules for 9-ball |
| **Admin** | 🔒 | PIN-protected admin control panel |

### Home View Details
- Ladder with Points, Box Pts, Open Pts, Wins, Losses columns.
- Active-only toggle to filter inactive players.
- Expandable player rows showing ELO, current round ELO delta, ELO rank, and recent match history.
- Round progress bar showing match completion percentage.
- Days remaining in round.
- Champion history (box winners per past round).
- Season award badges.

### Past Cycles (in Home)
- Expandable archive for every completed round.
- Per-cycle standings tab and match log tab.
- Shows which players received 1st/2nd place bonuses and forfeit penalties.

---

## 10. Data, History & Exports

### Real-Time Sync
- All data is stored in **Firebase Firestore** and syncs in real time across all connected devices.
- No server required — the app runs entirely client-side with Firestore as the backend.

### State Persistence
- The full league state is stored in a single Firestore document including: all players, all rounds, all matches, check-ins, settings, announcements, and the audit log.

### Past Cycle Archives
- Every completed round is archived with its full box structure, match results, bonuses, and penalties.
- Archives are permanent and accessible from the Home view.

### Audit Log
- Last 200 actions logged with timestamps, action type, and details.
- Searchable in the Admin panel.
- Actions include: round starts, round ends, match results, score edits, forfeits, player additions/removals, check-in changes, and settings changes.

### Exports
- **JSON backup**: Complete league snapshot, downloadable at any time.
- **CSV standings**: Current ladder export compatible with Excel/Sheets.

---

*Built with React + Firebase Firestore. Single-page application hosted on Firebase Hosting.*
