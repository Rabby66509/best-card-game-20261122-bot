// Ember Court — the duel's state: deck, hand, turns, win and loss.
// Pure logic, no DOM: render.js draws whatever this module holds.

import { CARD_BY_ID, DECK_LIST } from './cards.js';
import { chooseIntent, executeIntent } from './ai.js';

export const PLAYER_MAX_HP = 30;
export const ENEMY_MAX_HP = 50;
export const HAND_DRAW = 5;
export const MAX_HAND = 8;

// Small deterministic RNG so screenshot states reproduce exactly.
export function createRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function newGame(seed) {
  const rng = createRng(seed);
  const state = {
    seed,
    rng,
    turn: 1,
    phase: 'title', // title | play | won | lost
    player: { hp: PLAYER_MAX_HP, block: 0 },
    enemy: { hp: ENEMY_MAX_HP, block: 0, buff: 0, weaken: 0 },
    deck: shuffle(DECK_LIST, rng),
    hand: [],
    discard: [],
    energy: 0,
    energyMax: 3,
    intent: null,
    lastIntents: [],
    playedThisTurn: [],
    log: [],
    stats: { damageDealt: 0, cardsPlayed: 0, turnsTaken: 0 },
    floaters: [],
  };
  return state;
}

export function energyForTurn(turn) {
  return Math.min(3 + Math.floor((turn - 1) / 3), 5);
}

export function startGame(state) {
  state.phase = 'play';
  state.log = [{ cls: '', html: 'The duel begins. The Ash Regent awaits your first card.' }];
  beginTurn(state);
}

export function beginTurn(state) {
  state.energyMax = energyForTurn(state.turn);
  state.energy = state.energyMax;
  state.player.block = 0;
  state.playedThisTurn = [];
  drawCards(state, HAND_DRAW);
  if (!state.intent) state.intent = chooseIntent(state);
  pushLog(state, '', `Turn <b>${state.turn}</b> — you gain <b>${state.energy}</b> energy and draw cards.`);
}

export function drawCards(state, count) {
  for (let i = 0; i < count; i += 1) {
    if (state.hand.length >= MAX_HAND) break;
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break;
      state.deck = shuffle(state.discard, state.rng);
      state.discard = [];
      pushLog(state, '', 'Your discard pile is shuffled back into the deck.');
    }
    state.hand.push(state.deck.pop());
  }
}

// Play the card at handIndex. Returns { ok, reason } and appends log lines.
export function playCard(state, handIndex) {
  if (state.phase !== 'play') return { ok: false, reason: 'The duel is over.' };
  const cardId = state.hand[handIndex];
  if (!cardId) return { ok: false, reason: 'No card there.' };
  const card = CARD_BY_ID[cardId];
  if (state.energy < card.cost) return { ok: false, reason: 'Not enough energy.' };

  state.energy -= card.cost;
  state.hand.splice(handIndex, 1);
  state.discard.push(cardId);
  state.stats.cardsPlayed += 1;

  const comboHit = card.comboSuit && state.playedThisTurn.includes(card.comboSuit);
  state.playedThisTurn.push(card.suit);

  const events = [];
  if (card.dmg) {
    let dmg = card.dmg + (comboHit ? card.comboDmg : 0);
    const soaked = Math.min(state.enemy.block, dmg);
    state.enemy.block -= soaked;
    dmg -= soaked;
    state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
    state.stats.damageDealt += dmg;
    events.push({ type: 'dmg', amount: dmg, target: 'enemy' });
    pushLog(state, 'good',
      `<b>${card.name}</b> deals <b>${dmg}</b> damage${comboHit ? ' — the storm answers!' : ''}.`);
  }
  if (card.block) {
    state.player.block += card.block;
    events.push({ type: 'block', amount: card.block, target: 'player' });
    pushLog(state, 'good', `<b>${card.name}</b> raises <b>${card.block}</b> block.`);
  }
  if (card.heal) {
    const healed = Math.min(card.heal, PLAYER_MAX_HP - state.player.hp);
    state.player.hp += healed;
    events.push({ type: 'heal', amount: healed, target: 'player' });
    pushLog(state, 'good', `<b>${card.name}</b> restores <b>${healed}</b> health.`);
  }
  if (card.energy) {
    state.energy = Math.min(state.energy + card.energy, state.energyMax + 2);
    pushLog(state, 'good', `<b>${card.name}</b> returns <b>${card.energy}</b> energy.`);
  }
  if (card.weaken) {
    state.enemy.weaken += card.weaken;
    pushLog(state, 'good', `The Regent's attack is weakened by <b>${card.weaken}</b>.`);
  }
  if (card.draw) {
    drawCards(state, card.draw);
    pushLog(state, '', `You draw <b>${card.draw}</b> card${card.draw > 1 ? 's' : ''}.`);
  }

  if (state.enemy.hp <= 0) {
    state.phase = 'won';
    pushLog(state, 'good', 'The Ash Regent falls. <b>The Ember Court is yours!</b>');
  }
  return { ok: true, events };
}

// End the player's turn: the Regent acts on its telegraphed intent,
// then a fresh intent is chosen for the next turn.
export function endTurn(state) {
  if (state.phase !== 'play') return [];
  const lines = executeIntent(state);
  lines.forEach((line) => pushLog(state, line.cls, line.html));
  state.stats.turnsTaken += 1;
  if (state.player.hp <= 0) {
    state.phase = 'lost';
    pushLog(state, 'bad', 'Your ember gutters out. <b>The Ash Regent endures.</b>');
    return lines;
  }
  state.lastIntents.push(state.intent.kind);
  if (state.lastIntents.length > 2) state.lastIntents.shift();
  state.intent = chooseIntent(state);
  state.turn += 1;
  beginTurn(state);
  return lines;
}

export function score(state) {
  const winBonus = state.phase === 'won' ? state.player.hp * 3 : 0;
  return state.stats.damageDealt + state.stats.cardsPlayed * 2 + winBonus;
}

export function pushLog(state, cls, html) {
  state.log.push({ cls, html });
  if (state.log.length > 6) state.log.shift();
}
