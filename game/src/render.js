// Ember Court — draws the duel: fighters, intent, hand, log and overlays.
// All DOM lives here; state.js never touches the page.

import { CARD_BY_ID, SUITS } from './cards.js';
import { describeIntent } from './ai.js';
import { score, PLAYER_MAX_HP, ENEMY_MAX_HP } from './state.js';

const $ = (id) => document.getElementById(id);

export function render(state) {
  renderTopbar(state);
  renderEnemy(state);
  renderPlayer(state);
  renderIntent(state);
  renderLog(state);
  renderHand(state);
  renderEnergy(state);
  $('end-turn-btn').disabled = state.phase !== 'play';
  if (state.phase === 'won') showWin(state);
  else if (state.phase === 'lost') showLoss(state);
  else if (state.phase === 'play') hideOverlay();
  // phase 'title' leaves the title overlay alone.
}

function renderTopbar(state) {
  $('turn-label').innerHTML = `Turn <b>${state.turn}</b>`;
  $('score-label').innerHTML = `Score <b>${score(state)}</b>`;
  $('deck-label').innerHTML = `Deck <b>${state.deck.length}</b>`;
  $('discard-label').innerHTML = `Discard <b>${state.discard.length}</b>`;
}

function hpBar(hp, max, you) {
  const pct = Math.max(0, Math.round((hp / max) * 100));
  return `<div class="hp-bar"><div class="hp-fill${you ? ' you' : ''}" style="width:${pct}%"></div></div>
    <div class="hp-text">${hp} / ${max} HP</div>`;
}

function renderEnemy(state) {
  const e = state.enemy;
  const block = e.block > 0 ? `<span class="block-badge">🛡 ${e.block} block</span>` : '';
  const buff = e.buff > 0 ? `<span class="buff-badge">✦ +${e.buff} attack</span>` : '';
  const weaken = e.weaken > 0 ? `<span class="buff-badge">❄ −${e.weaken} attack</span>` : '';
  $('enemy-zone').innerHTML = `
    <div class="fighter">
      <div class="portrait" id="enemy-portrait">👑</div>
      <div>
        <div class="fighter-name">The Ash Regent ${block}${buff}${weaken}</div>
        <div class="fighter-sub">Ruler of the Ember Court · ${ENEMY_MAX_HP} health</div>
        <div class="hp-wrap">${hpBar(e.hp, ENEMY_MAX_HP, false)}</div>
      </div>
    </div>
    <div class="enemy-hand-count">Regent's hand<br><div class="mini-cards">
      <span class="mini-card"></span><span class="mini-card"></span><span class="mini-card"></span>
      <span class="mini-card"></span><span class="mini-card"></span></div>
    </div>`;
}

function renderPlayer(state) {
  const p = state.player;
  const block = p.block > 0 ? `<span class="block-badge">🛡 ${p.block} block</span>` : '';
  $('player-zone').innerHTML = `
    <div class="fighter">
      <div class="portrait you" id="player-portrait">🔥</div>
      <div>
        <div class="fighter-name">You — the Ember Warden ${block}</div>
        <div class="fighter-sub">Keeper of the last flame · ${PLAYER_MAX_HP} health</div>
        <div class="hp-wrap">${hpBar(p.hp, PLAYER_MAX_HP, true)}</div>
      </div>
    </div>
    <div class="player-hand-count">Your hand · ${state.hand.length} cards<br>
      <span>Deck ${state.deck.length} · Discard ${state.discard.length}</span></div>`;
}

function renderIntent(state) {
  const d = describeIntent(state);
  $('intent-panel').innerHTML = `
    <div class="intent-label">Regent's intent — next turn</div>
    <div class="intent-main ${d.cls}">${d.main}</div>
    <div class="intent-sub">${d.sub}</div>`;
}

function renderLog(state) {
  $('log').innerHTML = state.log
    .map((line) => `<div class="log-line ${line.cls}">${line.html}</div>`)
    .join('');
}

function renderEnergy(state) {
  let gems = '';
  for (let i = 0; i < state.energyMax; i += 1) {
    gems += `<span class="energy-gem${i < state.energy ? '' : ' spent'}"></span>`;
  }
  $('energy-row').innerHTML = `<span class="energy-label">Energy ${state.energy} / ${state.energyMax}</span>${gems}`;
}

export function cardElement(cardId, index) {
  const card = CARD_BY_ID[cardId];
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = `card suit-${card.suit}`;
  el.dataset.index = String(index);
  // Plain-text tooltip so the card's effect is readable on hover and by
  // screen readers, not only in the styled text on the card face.
  el.title = `${card.name} — ${card.text.replace(/<[^>]+>/g, '')} (cost ${card.cost})`;
  el.setAttribute('aria-label', el.title);
  el.innerHTML = `
    <div class="cost">${card.cost}</div>
    <div class="suit-band"><span class="glyph">${suit.glyph}</span>${suit.name}</div>
    <div class="art">${suit.glyph}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-text">${card.text}</div>
    <div class="key-hint">${index + 1}</div>`;
  return el;
}

function renderHand(state) {
  const hand = $('hand');
  hand.innerHTML = '';
  state.hand.forEach((cardId, i) => {
    const card = CARD_BY_ID[cardId];
    const el = cardElement(cardId, i);
    if (state.energy < card.cost) el.classList.add('unplayable');
    el.style.animationDelay = `${i * 0.06}s`;
    hand.appendChild(el);
  });
  if (state.hand.length === 0 && state.phase === 'play') {
    hand.innerHTML = '<div style="color:#9a8a6a;align-self:center">Hand empty — end your turn to draw again.</div>';
  }
}

// Floating combat numbers over a fighter's portrait.
export function floater(targetId, text, kind) {
  const anchor = document.getElementById(targetId);
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `floater ${kind}`;
  el.textContent = text;
  el.style.left = `${rect.left + rect.width / 2 - 20}px`;
  el.style.top = `${rect.top - 10}px`;
  $('floaters').appendChild(el);
  window.setTimeout(() => el.remove(), 1150);
}

function hideOverlay() {
  $('overlay').hidden = true;
  $('overlay').innerHTML = '';
}

function showWin(state) {
  $('overlay').hidden = false;
  $('overlay').innerHTML = `
    <div class="panel">
      <div class="win-flourish">👑🔥</div>
      <h1>VICTORY</h1>
      <p class="tagline">The Ash Regent bows. The Ember Court is yours.</p>
      <div class="score-lines">
        Final score <b>${score(state)}</b><br>
        Damage dealt <b>${state.stats.damageDealt}</b> · Cards played <b>${state.stats.cardsPlayed}</b><br>
        Turns taken <b>${state.stats.turnsTaken}</b> · Health remaining <b>${state.player.hp}</b>
      </div>
      <button class="big-btn" id="again-btn" type="button">Play Again</button>
    </div>`;
  $('again-btn').addEventListener('click', () => window.location.reload());
}

function showLoss(state) {
  $('overlay').hidden = false;
  $('overlay').innerHTML = `
    <div class="panel">
      <div class="win-flourish">🕯️</div>
      <h1 class="lose">DEFEAT</h1>
      <p class="tagline">Your ember gutters out. The Ash Regent endures… for now.</p>
      <div class="score-lines">
        Final score <b>${score(state)}</b><br>
        Damage dealt <b>${state.stats.damageDealt}</b> · Cards played <b>${state.stats.cardsPlayed}</b><br>
        Turns taken <b>${state.stats.turnsTaken}</b> · The Regent had <b>${state.enemy.hp}</b> health left
      </div>
      <button class="big-btn" id="again-btn" type="button">Try Again</button>
    </div>`;
  $('again-btn').addEventListener('click', () => window.location.reload());
}

export function showTitle(onStart) {
  const overlay = $('overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <div class="panel">
      <h1>EMBER COURT</h1>
      <p class="tagline">A duel of cards beneath a dying flame.</p>
      <div class="rules">
        You are the <b>Ember Warden</b>. The <b>Ash Regent</b> holds the court and
        <b>50 health</b> — take it to zero before yours is gone.<br>
        Each turn you gain <b>energy</b> and draw <b>5 cards</b>. Playing a card
        spends its cost. <b>Block</b> soaks damage until your next turn.<br>
        The Regent shows its <b>intent</b> before it acts — block a strike,
        weaken it, or strike first.<br>
        <div class="suit-key">
          <span><b style="color:#e2483a">▲ Flame</b> — damage</span>
          <span><b style="color:#4aa3df">❄ Frost</b> — block &amp; weaken</span>
          <span><b style="color:#58b368">✿ Thorn</b> — draw &amp; guard</span>
          <span><b style="color:#e8b93a">⚡ Storm</b> — combos &amp; energy</span>
        </div>
      </div>
      <button class="big-btn" id="start-btn" type="button">Begin the Duel</button>
    </div>`;
  $('start-btn').addEventListener('click', onStart);
}

export function showHelp(onClose) {
  const overlay = $('overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <div class="panel">
      <h1 style="font-size:32px">HOW TO PLAY</h1>
      <div class="rules">
        <b>Click a card</b> (or press <b>1–7</b>) to play it if you can pay its cost.<br>
        <b>Space / End Turn</b> passes to the Regent, who acts on the intent shown.<br>
        <b>Block</b> absorbs damage and fades at the start of your next turn.<br>
        <b>Storm Call</b> deals +4 if you already played a Storm card this turn.<br>
        <b>Winter's Bite</b> and <b>Vine Snare</b> weaken the Regent's next attack.<br>
        Win by bringing the Regent to <b>0 health</b>. Lose if yours reaches 0.
      </div>
      <button class="big-btn" id="close-help-btn" type="button">Back to the Duel</button>
    </div>`;
  $('close-help-btn').addEventListener('click', onClose);
}
