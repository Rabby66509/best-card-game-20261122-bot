# Ember Court — a card duel

An original single-player card battler for make.fun's best card game bounty.
You are the Ember Warden, duelling the Ash Regent for the Ember Court.

## The duel

- You have **30 health**; the Regent has **50**. Bring the Regent to 0 before yours is gone.
- Each turn you gain **energy** (3, growing to 5) and draw **5 cards** from a
  20-card deck of **16 distinct cards** across four suits:
  - **▲ Flame** (red) — raw damage
  - **❄ Frost** (blue) — block and weakening the Regent's attack
  - **✿ Thorn** (green) — card draw and guard
  - **⚡ Storm** (gold) — combos and energy
- Cards combine: **Storm Call** deals +4 if you already played a Storm card
  this turn; **Winter's Bite** and **Vine Snare** weaken the Regent's next
  attack; **Lightning Rod** refunds energy so a big card can follow.
- The Regent **shows its intent** before it acts — strike, double strike,
  guard, or channel +attack — so every turn is a readable decision: block,
  weaken, or strike first.

## Controls

- Click a card (or press **1–7**) to play it. **Space** / **End Turn** passes
  to the Regent. **?** opens the how-to-play panel.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are real renders of the game's own code: `?shot=title|play|win|loss`
poses the game deterministically (see `game/src/shots.js` and `shots.json`).

## Layout

- `game/index.html` — page skeleton
- `game/styles.css` — table, cards, overlays
- `game/src/cards.js` — the 16-card catalogue and suits
- `game/src/ai.js` — the Regent's intents
- `game/src/state.js` — deck, turns, win/loss
- `game/src/render.js` — all DOM drawing
- `game/src/shots.js` — deterministic screenshot poses
- `game/src/main.js` — bootstrap and input
- `main.ts` — copies game/ + screenshots/ to /output, writes dossier.json
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

MIT licensed. Original names, art and rules — no commercial game is copied.
