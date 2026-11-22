// Ember Court — screenshot presets: deterministic states for the four
// screenshots, rendered by the game's own code in a real browser.
// ?shot=title | play | win | loss (optional &seed=N, default 7)

import { newGame, startGame, playCard, pushLog } from './state.js';
import { chooseIntent } from './ai.js';

// A fixed mid-duel table: turn 3, both fighters bloodied, a full hand,
// the Regent telegraphing a heavy strike, block up on both sides.
export function applyShot(state, name) {
  if (name === 'title') {
    state.phase = 'title';
    return;
  }
  startGame(state);
  if (name === 'play') {
    state.turn = 3;
    state.player.hp = 22;
    state.player.block = 6;
    state.enemy.hp = 14;
    state.enemy.block = 4;
    state.enemy.buff = 2;
    state.energy = 4;
    state.energyMax = 4;
    state.hand = ['cinder-burst', 'glacial-wall', 'storm-call', 'thorn-whip', 'lightning-rod'];
    state.deck = ['ember-slash', 'frost-shard', 'tempest', 'vine-snare', 'wildfire', 'gale-step'];
    state.discard = ['ember-slash', 'briar-shield', 'frost-shard'];
    state.intent = { kind: 'strike', value: 7 };
    state.stats = { damageDealt: 16, cardsPlayed: 7, turnsTaken: 2 };
    state.log = [
      { cls: 'good', html: '<b>Thorn Whip</b> deals <b>3</b> damage. You draw <b>1</b> card.' },
      { cls: 'bad', html: 'The Regent strikes for <b>8</b>.' },
      { cls: 'good', html: '<b>Glacial Wall</b> raises <b>9</b> block.' },
      { cls: '', html: 'Turn <b>3</b> — you gain <b>4</b> energy and draw cards.' },
    ];
    return;
  }
  if (name === 'win') {
    // Play a scripted line to a real victory: Frostfire finishes the Regent.
    state.hand = ['frostfire', 'ember-slash', 'gale-step'];
    state.energy = 3;
    state.enemy.hp = 8;
    state.player.hp = 18;
    state.player.block = 3;
    state.stats = { damageDealt: 31, cardsPlayed: 11, turnsTaken: 4 };
    pushLog(state, 'good', '<b>Frostfire</b> deals <b>9</b> damage.');
    playCard(state, 0);
    return;
  }
  if (name === 'loss') {
    // A scripted collapse: the Regent's double strike ends the Warden.
    state.turn = 5;
    state.player.hp = 6;
    state.player.block = 0;
    state.enemy.hp = 19;
    state.enemy.buff = 3;
    state.intent = { kind: 'double', value: 5 };
    state.hand = ['ember-slash', 'briar-shield', 'gale-step', 'frost-shard'];
    state.energy = 2;
    state.stats = { damageDealt: 21, cardsPlayed: 9, turnsTaken: 4 };
    pushLog(state, 'bad', 'The Regent strikes for <b>5</b>.');
    pushLog(state, 'bad', 'The Regent strikes for <b>5</b>.');
    state.player.hp = 0;
    state.phase = 'lost';
    pushLog(state, 'bad', 'Your ember gutters out. <b>The Ash Regent endures.</b>');
    return;
  }
}

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  const seed = Number(params.get('seed') || '7');
  return { shot, seed: Number.isFinite(seed) ? seed : 7 };
}

// Build a fresh game already posed for the requested screenshot.
export function gameForShot(shot, seed) {
  const state = newGame(seed);
  applyShot(state, shot);
  return state;
}

export { chooseIntent };
