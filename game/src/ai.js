// Ember Court — the Ash Regent's mind: readable intents, picked one turn
// ahead so the player can see the attack coming and answer it.

// Intent kinds:
//   strike — deal damage (value, plus the Regent's attack buff)
//   guard  — gain block
//   surge  — channel: +3 attack buff for later strikes
//   double — two smaller strikes (only once the duel has warmed up)
export function chooseIntent(state) {
  const rng = state.rng;
  const turn = state.turn;
  const roll = rng();
  let kind;
  if (turn <= 1) {
    kind = roll < 0.55 ? 'strike' : 'guard';
  } else if (turn <= 3) {
    kind = roll < 0.5 ? 'strike' : roll < 0.75 ? 'guard' : 'surge';
  } else {
    kind = roll < 0.42 ? 'strike' : roll < 0.62 ? 'guard' : roll < 0.8 ? 'surge' : 'double';
  }
  // Never the same intent three turns running: the Regent must vary.
  if (state.lastIntents.length >= 2 &&
      state.lastIntents[0] === kind && state.lastIntents[1] === kind) {
    kind = kind === 'strike' ? 'guard' : 'strike';
  }
  return { kind, value: intentValue(state, kind) };
}

export function intentValue(state, kind) {
  const turn = state.turn;
  if (kind === 'strike') return 7 + Math.floor(turn / 2);
  if (kind === 'double') return 6 + Math.floor(turn / 3);
  if (kind === 'guard') return 8 + turn;
  return 4; // surge: +4 attack buff
}

export function describeIntent(state) {
  const intent = state.intent;
  if (!intent) return { main: '—', sub: 'The Regent is watching you.', cls: '' };
  const buff = state.enemy.buff;
  if (intent.kind === 'strike') {
    const dmg = Math.max(0, intent.value + buff - state.enemy.weaken);
    return {
      main: `Strikes for ${dmg}`,
      sub: state.enemy.weaken > 0
        ? `Weakened by ${state.enemy.weaken} — play block or strike first.`
        : 'Block it, weaken it, or end the duel before it lands.',
      cls: '',
    };
  }
  if (intent.kind === 'double') {
    const hit = Math.max(0, intent.value + buff - state.enemy.weaken);
    return {
      main: `Double Strike ${hit} × 2`,
      sub: 'Two blows coming — block absorbs the first, not the second.',
      cls: '',
    };
  }
  if (intent.kind === 'guard') {
    return {
      main: `🛡 Shields for ${intent.value}`,
      sub: 'A quiet turn — press the attack while the Regent hides.',
      cls: 'guard',
    };
  }
  return {
    main: `Channels +${intent.value} attack`,
    sub: 'The Regent is gathering power — hit hard now, or regret it later.',
    cls: 'surge',
  };
}

// Carry the chosen intent out. Returns log lines for the battle log.
export function executeIntent(state) {
  const intent = state.intent;
  const lines = [];
  if (!intent) return lines;
  const enemy = state.enemy;
  if (intent.kind === 'strike' || intent.kind === 'double') {
    const hits = intent.kind === 'double' ? 2 : 1;
    for (let i = 0; i < hits; i += 1) {
      const raw = Math.max(0, intent.value + enemy.buff - enemy.weaken);
      const dealt = dealDamageToPlayer(state, raw);
      lines.push({
        cls: dealt > 0 ? 'bad' : 'good',
        html: `The Regent strikes for <b>${dealt}</b>${enemy.block > 0 ? '' : ''}.`,
      });
      if (state.player.hp <= 0) break;
    }
    enemy.weaken = 0;
  } else if (intent.kind === 'guard') {
    enemy.block += intent.value;
    lines.push({ cls: 'good', html: `The Regent raises <b>${intent.value}</b> block.` });
  } else if (intent.kind === 'surge') {
    enemy.buff += intent.value;
    lines.push({ cls: 'bad', html: `The Regent channels <b>+${intent.value}</b> attack.` });
  }
  return lines;
}

// Damage to the player, soaked by block first. Returns damage to hit points.
export function dealDamageToPlayer(state, raw) {
  const soaked = Math.min(state.player.block, raw);
  state.player.block -= soaked;
  const dealt = raw - soaked;
  state.player.hp = Math.max(0, state.player.hp - dealt);
  return dealt;
}
