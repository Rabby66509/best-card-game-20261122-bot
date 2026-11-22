// Ember Court — bootstrap and input: clicks, keys, and the screenshot hook.
// The duel itself lives in state.js; the drawing in render.js.

import { newGame, startGame, playCard, endTurn } from './state.js';
import { render, floater, showTitle, showHelp } from './render.js';
import { shotFromUrl, gameForShot } from './shots.js';

const shot = shotFromUrl();
let state;

if (shot) {
  // Screenshot mode: pose the game, draw it, stay still for the camera.
  state = gameForShot(shot.shot, shot.seed);
  if (shot.shot === 'title') showTitle(() => {});
  render(state);
} else {
  state = newGame((Date.now() % 100000) | 0);
  render(state);
  showTitle(() => {
    startGame(state);
    render(state);
  });
}

function afterPlay(result, cardEl) {
  if (!result.ok) {
    if (cardEl) {
      cardEl.classList.add('shake');
      window.setTimeout(() => cardEl.classList.remove('shake'), 320);
    }
    return;
  }
  (result.events || []).forEach((event) => {
    if (event.type === 'dmg') floater('enemy-portrait', `−${event.amount}`, 'dmg');
    if (event.type === 'heal') floater('player-portrait', `+${event.amount}`, 'heal');
    if (event.type === 'block') floater('player-portrait', `+${event.amount} 🛡`, 'block');
  });
  render(state);
}

document.getElementById('hand').addEventListener('click', (event) => {
  if (state.phase !== 'play' || shot) return;
  const cardEl = event.target.closest('.card');
  if (!cardEl) return;
  const index = Number(cardEl.dataset.index);
  cardEl.classList.add('played');
  window.setTimeout(() => afterPlay(playCard(state, index), cardEl), 120);
});

document.getElementById('end-turn-btn').addEventListener('click', () => {
  if (state.phase !== 'play' || shot) return;
  endTurn(state);
  render(state);
});

document.getElementById('help-btn').addEventListener('click', () => {
  showHelp(() => render(state));
});

document.addEventListener('keydown', (event) => {
  if (shot) return;
  if (state.phase !== 'play') return;
  if (event.key >= '1' && event.key <= '7') {
    const index = Number(event.key) - 1;
    const cardEl = document.querySelector(`.card[data-index="${index}"]`);
    if (!cardEl) return;
    cardEl.classList.add('played');
    window.setTimeout(() => afterPlay(playCard(state, index), cardEl), 120);
  } else if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    endTurn(state);
    render(state);
  }
});
