/**
 * @typedef {Object} PadButtonInput
 * @property {'button'} type
 * @property {number} index
 */

/**
 * @typedef {Object} PadAxisInput
 * @property {'axis'} type
 * @property {number} index
 * @property {number} value
 */

/**
 * @typedef {PadButtonInput | PadAxisInput} PadInput
 */

/**
 * @typedef {Object} JoystickActionDefinition
 * @property {string} icon
 * @property {string} label
 */

/**
 * @typedef {Object} PadSnapshot
 * @property {number[]} axes
 * @property {boolean[]} buttons
 */

/**
 * @typedef {Object} LearningState
 * @property {string} action
 * @property {number} pad
 * @property {PadSnapshot} base
 * @property {number} until
 */

/**
 * @typedef {Object} GamepadProfile
 * @property {Record<string, PadInput[]>} [action]
 */

/**
 * @typedef {Object} Direction
 * @property {number} x
 * @property {number} y
 */

const joystickUi = {
  status: byId('joystickStatus'),
  open: byId('joystickOpen'),
  dialog: byId('joystickDialog'),
  close: byId('joystickClose'),
  hint: byId('joystickHint'),
  map: byId('joystickMap'),
  reset: byId('joystickReset')
};

const joystick = {
  profiles: storage.read(STORAGE_KEYS.gamepad, {}),
  held: new Map(),
  driving: null,
  learning: null
};

/**
 * 🎮 Retorna os controles conectados
 * @returns {Gamepad[]}
 */
const connectedPads = () => [...(navigator.getGamepads?.() ?? [])].filter(Boolean);

/**
 * 🏷️ Nome amigável do controle
 * @param {Gamepad} pad
 * @returns {string}
 */
const padName = (pad) => pad.id.replace(/\s*\(.*$/, '').trim() || pad.id;

/**
 * 🔗 Bindings de uma ação para o controle
 * @param {Gamepad} pad
 * @param {string} action
 * @returns {PadInput[]}
 */
const bindingsFor = (pad, action) => joystick.profiles[pad.id]?.[action] ?? JOYSTICK_DEFAULTS[action];

/**
 * ✏️ Input customizado de uma ação
 * @param {Gamepad} pad
 * @param {string} action
 * @returns {PadInput | undefined}
 */
const customInput = (pad, action) => joystick.profiles[pad.id]?.[action]?.[0];

/**
 * 💾 Persiste os perfis no storage
 * @returns {void}
 */
const persistProfiles = () => storage.write(STORAGE_KEYS.gamepad, joystick.profiles);

/**
 * 🕹️ Verifica se o valor de eixo indica hat (dpad)
 * @param {number} rest
 * @returns {boolean}
 */
const isHat = (rest) => Math.abs(rest) > JOYSTICK.axisLimit;

/**
 * ✅ Verifica se um input está ativo no controle
 * @param {Gamepad} pad
 * @param {PadInput} input
 * @returns {boolean}
 */
function isActive(pad, input) {
  if (input.type === 'button') return Boolean(pad.buttons[input.index]?.pressed);
  const value = pad.axes[input.index];
  if (value === undefined || Math.abs(value) > JOYSTICK.axisLimit) return false;
  if (Math.abs(input.value) >= JOYSTICK.snap) return value * Math.sign(input.value) > JOYSTICK.deadzone;
  return Math.abs(value - input.value) < JOYSTICK.hatTolerance;
}

/**
 * 📖 Lê as ações ativas do controle
 * @param {Gamepad} pad
 * @returns {Set<string>}
 */
function readActions(pad) {
  const actions = Object.keys(JOYSTICK_ACTIONS).filter((action) =>
    bindingsFor(pad, action).some((input) => isActive(pad, input))
  );
  return new Set(actions);
}

/**
 * ⚡ Executa as ações disparadas
 * @param {string[]} actions
 * @returns {void}
 */
function handleActions(actions) {
  if (document.querySelector('dialog[open]') || isHistoryOpen()) return;
  const direction = JOYSTICK_DIRECTIONS[actions.find((action) => action in JOYSTICK_DIRECTIONS)];
  if (direction) {
    if (game.state === 'idle') startGame();
    if (game.state === 'playing') queueTurn(direction.x, direction.y);
  }
  if (actions.includes('pause')) handleActionKey(' ');
  if (actions.includes('confirm')) handleActionKey('enter');
}

/**
 * 📸 Tira um snapshot do estado do controle
 * @param {Gamepad} pad
 * @returns {PadSnapshot}
 */
function snapshot(pad) {
  return { axes: [...pad.axes], buttons: pad.buttons.map((button) => button.pressed) };
}

/**
 * 👆 Verifica se um eixo foi empurrado em relação ao repouso
 * @param {number} value
 * @param {number} rest
 * @returns {boolean}
 */
function isPushed(value, rest) {
  if (isHat(rest)) return Math.abs(value) <= JOYSTICK.axisLimit;
  return Math.abs(value) >= JOYSTICK.snap && Math.abs(value) <= JOYSTICK.axisLimit && Math.abs(value - rest) > JOYSTICK.deadzone;
}

/**
 * 🎯 Captura o primeiro input novo do controle
 * @param {Gamepad} pad
 * @param {PadSnapshot} base
 * @returns {PadInput | null}
 */
function captureInput(pad, base) {
  const button = pad.buttons.findIndex((item, index) => item.pressed && !base.buttons[index]);
  if (button >= 0) return padButton(button);
  const axis = pad.axes.findIndex((value, index) => isPushed(value, base.axes[index] ?? 0));
  if (axis < 0) return null;
  const value = pad.axes[axis];
  const discrete = isHat(base.axes[axis] ?? 0);
  return padAxis(axis, discrete ? Math.round(value * 100) / 100 : Math.sign(value));
}

/**
 * 🗣️ Descreve um input em texto legível
 * @param {PadInput} input
 * @returns {string}
 */
function describeInput(input) {
  if (input.type === 'button') return `Botão ${input.index}`;
  if (Math.abs(input.value) >= JOYSTICK.snap) return `Eixo ${input.index} ${input.value > 0 ? '+' : '-'}`;
  return `Eixo ${input.index} (${input.value})`;
}

/**
 * 🧩 Cria um item de binding da lista
 * @param {[string, JoystickActionDefinition]} entry
 * @param {Gamepad | undefined} pad
 * @returns {HTMLLIElement}
 */
function createBinding([action, [icon, label]], pad) {
  const item = document.createElement('li');
  item.className = 'joystick-item';

  const name = document.createElement('span');
  name.className = 'joystick-action';
  const glyph = document.createElement('i');
  glyph.className = `fa-solid ${icon}`;
  glyph.setAttribute('aria-hidden', 'true');
  name.append(glyph, document.createTextNode(label));

  const listening = joystick.learning?.action === action;
  const custom = pad && customInput(pad, action);
  const bind = document.createElement('button');
  bind.type = 'button';
  bind.className = listening ? 'pill joystick-bind listening' : 'pill joystick-bind';
  bind.dataset.action = action;
  bind.disabled = !pad;
  bind.textContent = listening ? 'Aperte…' : custom ? describeInput(custom) : 'Padrão';

  item.append(name, bind);
  return item;
}

/**
 * 📊 Renderiza o status dos controles
 * @param {Gamepad[]} pads
 * @returns {void}
 */
function renderStatus(pads) {
  const [first] = pads;
  const extra = pads.length > 1 ? ` +${pads.length - 1}` : '';
  const icon = first ? 'fa-plug-circle-check' : 'fa-plug-circle-xmark';
  setLabel(joystickUi.status, icon, first ? `${padName(first)}${extra}` : 'Nenhum controle detectado');
  joystickUi.status.classList.toggle('on', Boolean(first));
}

/**
 * 🖼️ Renderiza toda a interface do joystick
 * @returns {void}
 */
function renderJoystick() {
  const pads = connectedPads();
  const [pad] = pads;
  renderStatus(pads);
  if (joystick.learning) joystickUi.hint.textContent = 'Aperte um botão ou mova a alavanca no controle';
  else if (pad) joystickUi.hint.textContent = 'Escolha uma ação e aperte o botão correspondente no controle';
  else joystickUi.hint.textContent = 'Conecte o controle e aperte qualquer botão para ele ser detectado';
  joystickUi.map.replaceChildren(...Object.entries(JOYSTICK_ACTIONS).map((entry) => createBinding(entry, pad)));
  joystickUi.reset.disabled = !pad || !joystick.profiles[pad.id];
}

/**
 * 🎓 Inicia o modo de aprendizado de uma ação
 * @param {string} action
 * @returns {void}
 */
function startLearning(action) {
  const [pad] = connectedPads();
  if (!pad) return;
  joystick.learning = { action, pad: pad.index, base: snapshot(pad), until: performance.now() + JOYSTICK.learnMs };
  renderJoystick();
}

/**
 * 🛑 Encerra o modo de aprendizado
 * @returns {void}
 */
function stopLearning() {
  joystick.learning = null;
  renderJoystick();
}

/**
 * 🧠 Processa o aprendizado do input
 * @param {Gamepad[]} pads
 * @returns {void}
 */
function learn(pads) {
  const { action, pad: index, base, until } = joystick.learning;
  const pad = pads.find((item) => item.index === index);
  if (!pad || performance.now() > until) {
    stopLearning();
    return;
  }
  base.buttons = base.buttons.map((held, button) => held && Boolean(pad.buttons[button]?.pressed));
  const input = captureInput(pad, base);
  if (!input) return;
  joystick.profiles[pad.id] = { ...joystick.profiles[pad.id], [action]: [input] };
  persistProfiles();
  stopLearning();
}

/**
 * 🔄 Loop de polling do joystick
 * @returns {void}
 */
function pollJoystick() {
  const pads = connectedPads();
  for (const pad of pads) {
    const before = joystick.held.get(pad.index) ?? new Set();
    const now = readActions(pad);
    joystick.held.set(pad.index, now);
    const fresh = [...now].filter((action) => !before.has(action));
    if (!fresh.length || joystick.learning || !settings.gamepad) continue;
    joystick.driving = pad.index;
    handleActions(fresh);
  }
  if (joystick.learning) learn(pads);
  requestAnimationFrame(pollJoystick);
}

window.addEventListener('gamepadconnected', renderJoystick);

window.addEventListener('gamepaddisconnected', (event) => {
  const { index } = event.gamepad;
  joystick.held.delete(index);
  if (joystick.driving === index && settings.gamepad && game.state === 'playing') pauseGame();
  if (joystick.learning?.pad === index) joystick.learning = null;
  renderJoystick();
});

joystickUi.open.addEventListener('click', () => {
  audio.play('tap');
  renderJoystick();
  joystickUi.dialog.showModal();
});

joystickUi.close.addEventListener('click', () => joystickUi.dialog.close());

joystickUi.dialog.addEventListener('click', (event) => {
  if (event.target === joystickUi.dialog) joystickUi.dialog.close();
});

joystickUi.dialog.addEventListener('close', () => {
  if (joystick.learning) stopLearning();
  blurActive();
});

joystickUi.map.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  audio.play('tap');
  if (joystick.learning?.action === button.dataset.action) stopLearning();
  else startLearning(button.dataset.action);
});

joystickUi.reset.addEventListener('click', () => {
  const [pad] = connectedPads();
  if (!pad) return;
  delete joystick.profiles[pad.id];
  persistProfiles();
  audio.play('tap');
  renderJoystick();
});

renderJoystick();
requestAnimationFrame(pollJoystick);