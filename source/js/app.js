/**
 * 🎮 Lógica principal e inicialização do jogo XNAJA.
 * @module App
 */

const byId = (id) => document.getElementById(id);
const ui = {
  stage: byId('stage'),
  canvas: byId('board'),
  score: byId('score'),
  menu: byId('menu'),
  menuTitle: byId('menuTitle'),
  menuText: byId('menuText'),
  menuStats: byId('menuStats'),
  menuButton: byId('menuButton'),
  settingsPanel: byId('settingsPanel'),
  sensRow: byId('sensRow'),
  glowRow: byId('glowRow'),
  dpad: byId('dpad'),
  dpadKeys: [...document.querySelectorAll('.dpad [data-key]')],
  toggles: [...document.querySelectorAll('.toggle')],
  volume: byId('volume'),
  volumeValue: byId('volumeValue'),
  volumeIcon: byId('volumeIcon'),
  historyOpen: byId('historyOpen'),
  historyClose: byId('historyClose'),
  historyClear: byId('historyClear'),
  historyList: byId('historyList'),
  sheet: byId('sheet'),
  settingsDialog: byId('settingsDialog'),
  settingsOpen: byId('settingsOpen'),
  guideOpen: byId('guideOpen'),
  guideClose: byId('guideClose'),
  guideDialog: byId('guideDialog'),
  guideTitle: byId('guideTitle'),
  guideTabs: byId('guideTabs'),
  guideBody: byId('guideBody'),
  settingsClose: byId('settingsClose'),
  brand: byId('brand'),
  themeColor: document.querySelector('meta[name="theme-color"]'),
  navFx: byId('navFx'),
  lives: byId('lives'),
  livesValue: byId('livesValue'),
  level: byId('level'),
  levelValue: byId('levelValue'),
  xp: byId('xp'),
  xpFill: byId('xpFill'),
  version: byId('version'),
  updateButton: byId('updateButton')
};
const ctx = ui.canvas.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const view = { scale: 1 };
const desktopQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

/**
 * 🗄️ Sistema de armazenamento local com tratamento de erros.
 * @type {Object}
 */
const storage = {
  read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
  }
};

const settings = { ...DEFAULT_SETTINGS, ...storage.read(STORAGE_KEYS.settings, {}) };
if (!Object.values(CONTROL).includes(settings.control)) settings.control = CONTROL.drag;

/**
 * 🔗 Lê os modos de jogo passados via URL.
 * @returns {Array<string>} Lista de modos.
 */
function readUrlModes() {
  const query = new URLSearchParams(location.search).get('m');
  const hash = new URLSearchParams(location.hash.slice(1)).get('m');
  const path = location.pathname.match(/\/m=([^/]+)/)?.[1];
  return (query ?? hash ?? path ?? '').toLowerCase().split(',').map((mode) => mode.trim());
}

const urlModes = readUrlModes();
urlModes.forEach((mode) => Object.assign(settings, MODE_SETTINGS[mode]));
document.body.classList.toggle('immersive', urlModes.includes(IMMERSIVE_MODE));

const cleanUrl = new URL(window.location.href);
if (cleanUrl.searchParams.has(UPDATE_PARAM)) {
  cleanUrl.searchParams.delete(UPDATE_PARAM);
  window.history.replaceState(null, '', cleanUrl);
}

const SOUND_EFFECTS = {
  start: () => [
    { frequency: 392, endFrequency: 523, duration: 0.12, type: 'triangle' },
    { frequency: 523, endFrequency: 784, duration: 0.18, type: 'triangle', delay: 0.1 }
  ],
  eat: () => [
    { frequency: 600, endFrequency: 810, duration: 0.16, type: 'square', volume: 0.1 },
    { frequency: 1200, endFrequency: 1620, duration: 0.16, type: 'sine', volume: 0.12 }
  ],
  turn: () => [{ frequency: 330, endFrequency: 280, duration: 0.04, type: 'sine', volume: 0.04 }],
  over: () => [
    { frequency: 330, endFrequency: 260, duration: 0.18, type: 'sawtooth', volume: 0.07 },
    { frequency: 262, endFrequency: 196, duration: 0.2, type: 'sawtooth', volume: 0.07, delay: 0.16 },
    { frequency: 196, endFrequency: 110, duration: 0.4, type: 'sawtooth', volume: 0.08, delay: 0.34 }
  ],
  record: () => [
    { frequency: 523, duration: 0.12, type: 'triangle', delay: 0 },
    { frequency: 659, duration: 0.12, type: 'triangle', delay: 0.12 },
    { frequency: 784, duration: 0.12, type: 'triangle', delay: 0.24 },
    { frequency: 1047, duration: 0.3, type: 'triangle', delay: 0.36 }
  ],
  level: () => [
    { frequency: 523, duration: 0.1, type: 'triangle' },
    { frequency: 659, duration: 0.1, type: 'triangle', delay: 0.1 },
    { frequency: 784, duration: 0.18, type: 'triangle', delay: 0.2 }
  ],
  pause: () => [{ frequency: 440, endFrequency: 330, duration: 0.1, type: 'sine', volume: 0.1 }],
  resume: () => [{ frequency: 330, endFrequency: 440, duration: 0.1, type: 'sine', volume: 0.1 }],
  heart: () => [
    { frequency: 660, endFrequency: 880, duration: 0.1, type: 'sine', volume: 0.12 },
    { frequency: 880, endFrequency: 1320, duration: 0.16, type: 'triangle', volume: 0.1, delay: 0.09 },
    { frequency: 1320, endFrequency: 1760, duration: 0.22, type: 'sine', volume: 0.09, delay: 0.18 }
  ],
  life: () => [
    { frequency: 440, endFrequency: 220, duration: 0.2, type: 'triangle', volume: 0.1 },
    { frequency: 330, endFrequency: 660, duration: 0.26, type: 'sine', volume: 0.1, delay: 0.16 }
  ],
  tap: () => [{ frequency: 600, endFrequency: 700, duration: 0.05, type: 'sine', volume: 0.08 }]
};

/**
 * 🔊 Sistema de áudio e reprodução de efeitos sonoros.
 * @type {Object}
 */
const audio = {
  context: null,
  master: null,
  output: null,

  unlock() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    if (!this.context) {
      this.context = new AudioContextClass();
      const compressor = this.context.createDynamicsCompressor();
      this.master = this.context.createGain();
      this.master.gain.value = 1.4;
      this.output = this.context.createGain();
      this.output.gain.value = settings.volume / 100;
      this.output.connect(this.context.destination);
      this.master.connect(compressor).connect(this.output);
    }
    if (this.context.state !== 'running') this.context.resume().catch(() => {});
    return this.context;
  },

  decode(data) {
    return new Promise((resolve, reject) => this.context.decodeAudioData(data, resolve, reject));
  },

  setVolume() {
    this.output?.gain.setTargetAtTime(settings.volume / 100, this.context.currentTime, 0.03);
  },

  schedule({ frequency, endFrequency = frequency, duration = 0.12, type = 'sine', volume = 0.12, delay = 0 }) {
    const context = this.context;
    const start = context.currentTime + delay;
    const end = start + duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency !== frequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain).connect(this.master);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  },

  tone(options) {
    const context = this.unlock();
    if (!context) return;
    if (context.state === 'running') this.schedule(options);
    else context.resume().then(() => this.schedule(options)).catch(() => {});
  },

  play(name, detail) {
    if (!settings.sound) return;
    SOUND_EFFECTS[name](detail).forEach((tone) => this.tone(tone));
  }
};

const clampTracks = (value) => Math.min(MUSIC.maxTracks, Math.max(1, Number(value) || 1));
const trackUrl = (index) => `${MUSIC.dir}/${MUSIC.name}${index ? `-${index + 1}` : ''}.${MUSIC.ext}`;

/**
 * 🎵 Lê o estado atual da música salvo na sessão.
 * @returns {Object} Estado da música.
 */
function readMusicState() {
  try {
    const { index, offset } = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.music));
    return { index: Number(index) || 0, offset: Number(offset) || 0, fresh: false };
  } catch {
    return { index: 0, offset: 0, fresh: true };
  }
}

const savedMusic = readMusicState();
const initialTracks = clampTracks(storage.read(STORAGE_KEYS.tracks, 1));

/**
 * 🎵 Gerenciador de música de fundo.
 * @type {Object}
 */
const music = {
  gain: null,
  source: null,
  buffer: null,
  buffers: new Map(),
  tracks: initialTracks,
  index: savedMusic.fresh ? Math.floor(Math.random() * initialTracks) : savedMusic.index,
  upcoming: null,
  stock: [],
  primed: false,
  offset: savedMusic.offset,
  startedAt: 0,
  continuing: false,
  busy: false,
  level: MUSIC.menuVolume,

  position() {
    if (!this.source) return this.offset;
    return (this.offset + audio.context.currentTime - this.startedAt) % this.buffer.duration;
  },

  persist() {
    try {
      sessionStorage.setItem(STORAGE_KEYS.music, JSON.stringify({ index: this.index, offset: this.position() }));
    } catch {
      return;
    }
  },

  bufferFor(index) {
    if (!this.buffers.has(index)) {
      this.buffers.set(
        index,
        fetch(trackUrl(index))
          .then((response) => (response.ok ? response.arrayBuffer() : null))
          .then((data) => (data ? audio.decode(data) : null))
          .catch(() => null)
      );
    }
    return this.buffers.get(index);
  },

  refillStock() {
    const stock = [];
    for (let i = 0; i < this.tracks; i++) {
      if (this.primed || i !== this.index) stock.push(i);
    }
    this.primed = true;
    for (let i = stock.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [stock[i], stock[j]] = [stock[j], stock[i]];
    }
    if (stock.length > 1 && stock[0] === this.index) {
      const j = 1 + Math.floor(Math.random() * (stock.length - 1));
      [stock[0], stock[j]] = [stock[j], stock[0]];
    }
    this.stock = stock;
  },

  pickNext() {
    if (this.tracks < 2) return 0;
    this.stock = this.stock.filter((i) => i >= 0 && i < this.tracks);
    if (!this.stock.length) this.refillStock();
    return this.stock.shift();
  },

  warm() {
    if (this.tracks > 1 && (this.upcoming === null || this.upcoming >= this.tracks)) this.upcoming = this.pickNext();
    const next = this.tracks > 1 ? this.upcoming : null;
    if (next !== null) this.bufferFor(next);
    for (const key of [...this.buffers.keys()]) {
      if (key !== this.index && key !== next) this.buffers.delete(key);
    }
  },

  async discover() {
    let total = 1;
    for (let index = 1; index < MUSIC.maxTracks; index++) {
      const found = await fetch(trackUrl(index), { method: 'HEAD' })
        .then((response) => response.ok && !(response.headers.get('content-type') ?? '').includes('text/html'))
        .catch(() => null);
      if (found === null) return;
      if (!found) break;
      total = index + 1;
      if (index < this.tracks) continue;
      this.tracks = total;
      if (this.source) this.source.loop = false;
      storage.write(STORAGE_KEYS.tracks, this.tracks);
      if (index !== this.index && index !== this.upcoming && !this.stock.includes(index)) {
        this.stock.splice(Math.floor(Math.random() * (this.stock.length + 1)), 0, index);
      }
      this.warm();
    }
    if (total < this.tracks) {
      this.tracks = total;
      storage.write(STORAGE_KEYS.tracks, this.tracks);
      this.stock = this.stock.filter((i) => i < this.tracks);
      if (this.upcoming !== null && this.upcoming >= this.tracks) this.upcoming = null;
      if (this.source) this.source.loop = this.tracks === 1;
      this.warm();
    }
  },

  async sync() {
    if (!settings.music) {
      this.stop();
      return;
    }
    if (this.busy || !audio.unlock()) return;
    this.busy = true;
    try {
      for (let tries = 0; tries < this.tracks && !this.source; tries++) {
        this.index %= this.tracks;
        const buffer = await this.bufferFor(this.index);
        if (!settings.music || this.source) return;
        if (buffer) {
          this.start(buffer);
          return;
        }
        this.index += 1;
        this.offset = 0;
      }
    } finally {
      this.busy = false;
    }
  },

  start(buffer) {
    const { context } = audio;
    const source = context.createBufferSource();
    const continuing = this.continuing;
    this.continuing = false;
    this.buffer = buffer;
    this.gain = context.createGain();
    this.gain.gain.value = continuing ? this.level : 0;
    this.gain.connect(audio.output);
    source.buffer = buffer;
    source.loop = this.tracks === 1;
    source.connect(this.gain);
    source.onended = () => {
      if (this.source === source) this.advance();
    };
    this.source = source;
    this.startedAt = context.currentTime;
    source.start(0, this.offset % buffer.duration);
    if (!continuing) this.fadeTo(this.level);
    this.warm();
  },

  advance() {
    const { source, gain } = this;
    this.source = null;
    this.gain = null;
    source.disconnect();
    gain.disconnect();
    this.index = (this.upcoming ?? this.pickNext()) % this.tracks;
    this.upcoming = null;
    this.offset = 0;
    this.continuing = true;
    this.sync();
  },

  stop() {
    if (!this.source) return;
    this.offset = this.position();
    const { source, gain } = this;
    this.source = null;
    this.gain = null;
    gain.gain.setTargetAtTime(0, audio.context.currentTime, MUSIC.fade);
    window.setTimeout(() => {
      source.stop();
      source.disconnect();
      gain.disconnect();
    }, 1000);
  },

  fadeTo(volume) {
    this.level = volume;
    this.gain?.gain.setTargetAtTime(volume, audio.context.currentTime, MUSIC.fade);
  }
};

music.sync();
music.discover();

const isValidEntry = (entry) =>
  entry &&
  typeof entry.id === 'string' &&
  Number.isFinite(entry.score) &&
  Number.isFinite(entry.date);

let history = storage.read(STORAGE_KEYS.history, []).filter(isValidEntry);

/**
 * 🐍 Estado principal do jogo.
 * @type {Object}
 */
const game = {
  state: 'idle',
  cols: 0,
  rows: 0,
  cell: 0,
  width: 0,
  height: 0,
  snake: [],
  previous: [],
  dir: { x: 0, y: -1 },
  queue: [],
  star: null,
  heart: null,
  lives: 0,
  ghost: 0,
  score: 0,
  interval: DEFAULT_SETTINGS.speed,
  lastTick: 0,
  progress: 1,
  lastFrame: 0,
  particles: [],
  level: 1,
  obstacles: [],
  banner: null,
  rings: [],
  embers: [],
  glow: 0,
  rgb: THEMES[0].rgb,
  hue: 300,
  prismAt: 0
};

const lerp = (from, to, t) => from + (to - from) * t;
const wrapHue = (hue) => ((hue % 360) + 360) % 360;
const hsl = (hue, saturation, lightness) => `hsl(${Math.round(wrapHue(hue))} ${saturation}% ${lightness}%)`;

/**
 * 🌈 Converte HSL para RGB.
 * @param {number} hue - Matiz.
 * @param {number} saturation - Saturação.
 * @param {number} lightness - Luminosidade.
 * @returns {string} String RGB.
 */
function hslToRgb(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n) => {
    const k = (n + wrapHue(hue) / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [channel(0), channel(8), channel(4)].map((value) => Math.round(value * 255)).join(', ');
}

const toHex = (rgb) => `#${rgb.split(', ').map((value) => Number(value).toString(16).padStart(2, '0')).join('')}`;

const prismTheme = (hue) => ({
  snake: hsl(hue, 100, 68),
  rgb: hslToRgb(hue, 100, 68),
  accent: hsl(hue, 100, 86),
  tint: toHex(hslToRgb(hue, 55, 8)),
  prism: true
});
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const hasEffects = () => Boolean(settings.graphics);
const isPrism = () => hasEffects() && game.level >= PRISM_LEVEL;
const vibrate = (ms) => navigator.vibrate?.(ms);
const blurActive = () => document.activeElement?.blur();
const samePosition = (a, b) => a.x === b.x && a.y === b.y;
const isObstacle = (cell) => game.obstacles.some((obstacle) => samePosition(obstacle, cell));
const randomInt = (limit) => Math.floor(Math.random() * limit);
const levelFor = (score) => 1 + Math.floor(score / STARS_PER_LEVEL);
const torusGap = (a, b, size) => Math.min(Math.abs(a - b), size - Math.abs(a - b));

/**
 * 📏 Mede a escala de zoom necessária para telas de toque.
 * @returns {number} Fator de escala.
 */
function measureScale() {
  const touch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  if (!touch) return 1;
  const physical = Math.min(screen.width, screen.height) || window.innerWidth;
  const byScreen = Math.min(window.innerWidth, window.innerHeight) / physical;
  const byZoom = 1 / (window.visualViewport?.scale || 1);
  const scale = Math.max(byScreen, byZoom);
  return scale > 1.3 ? Math.min(scale, 4) : 1;
}

/**
 * 🖥️ Aplica a escala calculada ao corpo do documento.
 */
function applyScale() {
  const scale = measureScale();
  const { style } = document.body;
  view.scale = scale;
  document.documentElement.style.setProperty('--s', String(scale));
  if (scale === 1) {
    style.transform = '';
    style.transformOrigin = '';
    style.width = '';
    style.height = '';
  } else {
    style.transformOrigin = '0 0';
    style.transform = `scale(${scale})`;
    style.width = `${window.innerWidth / scale}px`;
    style.height = `${window.innerHeight / scale}px`;
  }
  document.body.classList.toggle('compact', window.innerWidth / scale <= 480);
}

/**
 * 🏷️ Substitui o conteúdo de um elemento por um ícone e texto.
 * @param {HTMLElement} element - Elemento alvo.
 * @param {string} icon - Classe do ícone FontAwesome.
 * @param {string} text - Texto a ser exibido.
 */
function setLabel(element, icon, text) {
  const glyph = document.createElement('i');
  glyph.className = `fa-solid ${icon}`;
  glyph.setAttribute('aria-hidden', 'true');
  element.replaceChildren(glyph, document.createTextNode(text));
}

/**
 * 🏆 Calcula a maior pontuação no histórico.
 * @returns {number} Recorde.
 */
function bestScore() {
  return history.reduce((best, entry) => Math.max(best, entry.score), 0);
}

/**
 * 🏆 Calcula o maior nível no histórico.
 * @returns {number} Melhor nível.
 */
function bestLevel() {
  return history.reduce((best, entry) => Math.max(best, entry.level ?? 1), 1);
}

/**
 * 💾 Salva o histórico no armazenamento local.
 */
function persistHistory() {
  storage.write(STORAGE_KEYS.history, history);
}

/**
 * ➕ Adiciona um novo resultado ao histórico.
 * @param {number} score - Pontuação.
 * @param {number} level - Nível.
 */
function addResult(score, level) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const mode = Object.fromEntries(MODE_KEYS.map((key) => [key, settings[key]]));
  history = [{ id, score, level, mode, date: Date.now() }, ...history].slice(0, MAX_HISTORY);
  persistHistory();
}

/**
 * ❌ Remove um resultado do histórico.
 * @param {string} id - ID do resultado.
 */
function removeResult(id) {
  history = history.filter((entry) => entry.id !== id);
  persistHistory();
  renderHistory();
}

const CLEAR_CONFIRM_MS = 3000;
let clearTimer = null;

/**
 * 🔄 Desarma o botão de limpar histórico.
 */
function disarmClear() {
  window.clearTimeout(clearTimer);
  clearTimer = null;
  setLabel(ui.historyClear, 'fa-trash-can', 'Limpar tudo');
  ui.historyClear.classList.remove('armed');
}

/**
 * 🗑️ Limpa o histórico (com confirmação).
 */
function clearHistory() {
  if (!history.length) return;

  if (clearTimer === null) {
    setLabel(ui.historyClear, 'fa-triangle-exclamation', 'Toque de novo para confirmar');
    ui.historyClear.classList.add('armed');
    clearTimer = window.setTimeout(disarmClear, CLEAR_CONFIRM_MS);
    return;
  }

  disarmClear();
  history = [];
  persistHistory();
  renderHistory();
}

/**
 * 📅 Formata uma data para o padrão brasileiro.
 * @param {number} timestamp - Timestamp.
 * @returns {string} Data formatada.
 */
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 🏷️ Cria a lista de tags de modos de jogo.
 * @param {Object} mode - Configurações do modo.
 * @returns {HTMLElement} Elemento da lista.
 */
function createModes(mode) {
  const list = document.createElement('div');
  list.className = 'entry-modes';
  for (const key of MODE_KEYS) {
    const [icon, label] = MODE_LABELS[key][mode[key]] ?? [];
    if (!label) continue;
    const tag = document.createElement('span');
    tag.className = 'mode-tag';
    setLabel(tag, icon, label);
    list.append(tag);
  }
  return list;
}

/**
 * 📝 Cria um item da lista de histórico.
 * @param {Object} entry - Dados da partida.
 * @param {number} best - Recorde atual.
 * @returns {HTMLElement} Elemento da lista.
 */
function createEntry(entry, best) {
  const item = document.createElement('li');
  item.className = entry.score === best && best > 0 ? 'entry best' : 'entry';

  const score = document.createElement('span');
  score.className = 'entry-score';
  const stars = `${entry.score} ${entry.score === 1 ? 'estrela' : 'estrelas'}`;
  score.textContent = entry.level > 1 ? `${stars} · nível ${entry.level}` : stars;
  if (entry.score === best && best > 0) {
    const trophy = document.createElement('i');
    trophy.className = 'fa-solid fa-star';
    score.append(trophy);
  }

  const date = document.createElement('span');
  date.className = 'entry-date';
  date.textContent = formatDate(entry.date);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'icon-button';
  remove.dataset.id = entry.id;
  remove.setAttribute('aria-label', 'Remover resultado');
  const glyph = document.createElement('i');
  glyph.className = 'fa-solid fa-xmark';
  remove.append(glyph);

  item.append(score, date, remove);
  if (entry.mode) item.append(createModes(entry.mode));
  return item;
}

/**
 * 🖨️ Renderiza a lista de histórico na tela.
 */
function renderHistory() {
  ui.historyList.replaceChildren();
  ui.historyClear.disabled = history.length === 0;

  if (!history.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Nenhuma partida salva ainda';
    ui.historyList.append(empty);
    return;
  }

  const best = bestScore();
  ui.historyList.append(...history.map((entry) => createEntry(entry, best)));
}

/**
 * 📚 Lê os dados do guia.
 * @returns {Object} Dados do guia.
 */
function readGuide() {
  try {
    return { ...GUIDE_FALLBACK, ...guideData, sections: Array.isArray(guideData.sections) ? guideData.sections : [] };
  } catch {
    return GUIDE_FALLBACK;
  }
}

const guide = { ...readGuide(), active: 0 };

/**
 * ⌨️ Cria a lista de teclas de atalho.
 * @param {Array<string>} keys - Lista de teclas.
 * @returns {HTMLElement} Elemento da lista.
 */
function createGuideKeys(keys) {
  const list = document.createElement('div');
  list.className = 'guide-keys';
  list.append(
    ...keys.map((key) => {
      const cap = document.createElement('kbd');
      cap.textContent = key;
      return cap;
    })
  );
  return list;
}

/**
 * 📄 Cria um item do guia.
 * @param {Object} options - Opções do item.
 * @returns {HTMLElement} Elemento do item.
 */
function createGuideItem({ icon = 'fa-circle-info', title = '', text, tag, tone, keys }) {
  const item = document.createElement('li');
  item.className = tone ? `guide-item tone-${tone}` : 'guide-item';

  const glyph = document.createElement('i');
  glyph.className = `guide-icon fa-solid ${icon}`;
  glyph.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.className = 'guide-text';

  const heading = document.createElement('h3');
  heading.textContent = title;
  if (tag) {
    const badge = document.createElement('small');
    badge.className = 'guide-tag';
    badge.textContent = tag;
    heading.append(badge);
  }
  content.append(heading);

  if (text) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    content.append(paragraph);
  }
  if (keys?.length) content.append(createGuideKeys(keys));

  item.append(glyph, content);
  return item;
}

/**
 * 🖨️ Renderiza a seção ativa do guia.
 */
function renderGuideSection() {
  const section = guide.sections[guide.active];
  ui.guideBody.replaceChildren();

  if (!section) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Guia indisponível no momento';
    ui.guideBody.append(empty);
    return;
  }

  if (section.intro) {
    const intro = document.createElement('p');
    intro.className = 'guide-intro';
    intro.textContent = section.intro;
    ui.guideBody.append(intro);
  }

  const list = document.createElement('ul');
  list.className = 'guide-list';
  list.append(...(section.items ?? []).map(createGuideItem));
  ui.guideBody.append(list);
  ui.guideBody.scrollTop = 0;
  retrigger(ui.guideBody, 'swap');
}

/**
 * 🖨️ Renderiza as abas do guia.
 */
function renderGuideTabs() {
  setLabel(ui.guideTitle, guide.icon, guide.title);
  ui.guideTabs.hidden = guide.sections.length < 2;
  ui.guideTabs.replaceChildren(
    ...guide.sections.map((section, index) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'guide-tab';
      tab.dataset.index = String(index);
      tab.setAttribute('role', 'tab');
      setLabel(tab, section.icon ?? 'fa-circle-info', section.title ?? '');
      return tab;
    })
  );
}

/**
 * 🔀 Seleciona uma seção do guia.
 * @param {number} index - Índice da seção.
 */
function selectGuideSection(index) {
  guide.active = index;
  [...ui.guideTabs.children].forEach((tab, position) => {
    const on = position === index;
    tab.classList.toggle('on', on);
    tab.setAttribute('aria-selected', String(on));
    if (on) tab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  renderGuideSection();
}

/**
 * 📖 Abre o modal do guia.
 */
function openGuide() {
  ui.guideDialog.showModal();
  selectGuideSection(guide.active);
}

const isHistoryOpen = () => ui.sheet.classList.contains('open');

/**
 * 📜 Abre o painel de histórico.
 */
function openHistory() {
  pauseGame();
  disarmClear();
  renderHistory();
  ui.sheet.classList.add('open');
  ui.sheet.setAttribute('aria-hidden', 'false');
}

/**
 * 📜 Fecha o painel de histórico.
 */
function closeHistory() {
  disarmClear();
  ui.sheet.classList.remove('open');
  ui.sheet.setAttribute('aria-hidden', 'true');
  blurActive();
}

/**
 * 📐 Calcula e aplica o layout do tabuleiro.
 * @returns {boolean} Se houve mudança nas dimensões.
 */
function layout() {
  const ratioLimit = hasEffects() ? LAYOUT.maxRatio : LAYOUT.basicMaxRatio;
  const ratio = Math.min((window.devicePixelRatio || 1) * view.scale, ratioLimit);
  const boardLimit = desktopQuery.matches ? LAYOUT.maxBoardWidthDesktop : LAYOUT.maxBoardWidth;
  const maxWidth = Math.min(ui.stage.clientWidth - LAYOUT.marginX, boardLimit);
  const maxHeight = ui.stage.clientHeight - LAYOUT.marginY;
  const cell = Math.min(Math.floor(maxWidth / LAYOUT.minCols), LAYOUT.maxCell);
  const cols = Math.floor(maxWidth / cell);
  const rows = Math.max(LAYOUT.minRows, Math.floor(maxHeight / cell));
  const changed = cols !== game.cols || rows !== game.rows || cell !== game.cell;

  Object.assign(game, { cols, rows, cell, width: cols * cell, height: rows * cell });
  ui.canvas.width = game.width * ratio;
  ui.canvas.height = game.height * ratio;
  ui.canvas.style.width = `${game.width}px`;
  ui.canvas.style.height = `${game.height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  return changed;
}

/**
 * 🎯 Encontra uma célula livre no tabuleiro.
 * @param {Array<Object>} reserved - Células reservadas.
 * @returns {Object|null} Célula livre ou nulo.
 */
function pickFreeCell(reserved) {
  const free = [];
  for (let x = 0; x < game.cols; x++) {
    for (let y = 0; y < game.rows; y++) {
      const cell = { x, y };
      const occupied =
        game.snake.some((part) => samePosition(part, cell)) ||
        isObstacle(cell) ||
        reserved.some((item) => item && samePosition(item, cell));
      if (!occupied) free.push(cell);
    }
  }
  return free.length ? free[randomInt(free.length)] : null;
}

/**
 * ⭐ Posiciona a estrela no tabuleiro.
 */
function placeStar() {
  game.star = pickFreeCell([game.heart]);
}

/**
 * ❤️ Tenta posicionar um coração aleatoriamente.
 */
function maybePlaceHeart() {
  if (game.heart || game.level < HEART_MIN_LEVEL || game.lives >= MAX_LIVES) return;
  if (Math.random() > HEART_CHANCE) return;
  const cell = pickFreeCell([game.star]);
  if (!cell) return;
  game.heart = { ...cell, ttl: HEART_TTL_STEPS };
  spawnRing(cell.x * game.cell + game.cell / 2, cell.y * game.cell + game.cell / 2, COLORS.heart, game.cell * 1.8, 0.1);
}

/**
 * 💖 Sincroniza a UI de vidas.
 */
function syncLives() {
  ui.livesValue.textContent = String(game.lives);
  ui.lives.hidden = game.lives === 0 && game.level < HEART_MIN_LEVEL;
  document.body.classList.toggle('has-lives', !ui.lives.hidden);
}

/**
 * 💖 Define a quantidade de vidas.
 * @param {number} value - Novo valor.
 */
function setLives(value) {
  const gained = value > game.lives;
  game.lives = value;
  syncLives();
  ui.lives.classList.remove(gained ? 'hurt' : 'beat');
  retrigger(ui.lives, gained ? 'beat' : 'hurt');
}

/**
 * ⭐ Define a pontuação atual.
 * @param {number} value - Novo valor.
 */
function setScore(value) {
  game.score = value;
  ui.score.textContent = String(value);
  updateProgress();
  if (value === 0) return;
  ui.score.classList.remove('bump');
  void ui.score.offsetWidth;
  ui.score.classList.add('bump');
}

/**
 * 🧱 Verifica se uma célula está perto de um obstáculo.
 * @param {Object} cell - Célula a ser verificada.
 * @returns {boolean} Se está perto.
 */
function touchesObstacle(cell) {
  return game.obstacles.some(
    (obstacle) =>
      torusGap(obstacle.x, cell.x, game.cols) <= 1 && torusGap(obstacle.y, cell.y, game.rows) <= 1
  );
}

/**
 * 🧱 Posiciona obstáculos no tabuleiro.
 * @param {number} count - Quantidade a ser posicionada.
 */
function placeObstacles(count) {
  const head = game.snake[0];
  let placed = 0;

  for (let attempt = 0; attempt < count * 60 && placed < count; attempt++) {
    const cell = { x: randomInt(game.cols), y: randomInt(game.rows) };
    const nearHead =
      torusGap(cell.x, head.x, game.cols) < OBSTACLE_SAFE_RADIUS &&
      torusGap(cell.y, head.y, game.rows) < OBSTACLE_SAFE_RADIUS;
    const taken =
      game.snake.some((part) => samePosition(part, cell)) ||
      (game.star && samePosition(game.star, cell)) ||
      (game.heart && samePosition(game.heart, cell));
    if (nearHead || taken || touchesObstacle(cell)) continue;
    game.obstacles.push(cell);
    placed++;
  }
}

const currentTheme = () => (isPrism() ? prismTheme(game.hue) : THEMES[(game.level - 1) % THEMES.length]);

/**
 * 🎨 Aplica o tema visual atual.
 */
function applyTheme() {
  const theme = currentTheme();
  const root = document.documentElement.style;
  document.body.classList.toggle('prism', Boolean(theme.prism));
  COLORS.snake = theme.snake;
  game.rgb = theme.rgb;
  root.setProperty('--snake', theme.snake);
  root.setProperty('--snake-rgb', theme.rgb);
  root.setProperty('--accent-text', theme.accent);
  root.setProperty('--tint', theme.tint);
  ui.themeColor.content = theme.tint;
}

/**
 * 💎 Atualiza a cor no modo prisma.
 * @param {number} now - Timestamp atual.
 */
function tickPrism(now) {
  if (game.level < PRISM_LEVEL || reduceMotion) return;
  game.hue = wrapHue((now * PRISM_HUE_SPEED) / 1000);
  if (!hasEffects()) return;
  if (now - game.prismAt >= PRISM_STEP_MS) {
    game.prismAt = now;
    applyTheme();
    return;
  }
  const theme = prismTheme(game.hue);
  COLORS.snake = theme.snake;
  game.rgb = theme.rgb;
}

/**
 * 📊 Atualiza a barra de progresso do nível.
 */
function updateProgress() {
  const fraction = (game.score % STARS_PER_LEVEL) / STARS_PER_LEVEL;
  game.glow = Math.min(1, (game.level - 1) * 0.14 + fraction * 0.14);
  ui.xpFill.style.width = `${fraction * 100}%`;
  ui.levelValue.textContent = String(game.level);
  document.documentElement.style.setProperty('--glow', game.glow.toFixed(3));
}

/**
 * ✨ Sincroniza as partículas de brasa no fundo.
 */
function syncEmbers() {
  const target = reduceMotion || !hasEffects() ? 0 : Math.min(36, (game.level - 1) * 6);
  while (game.embers.length < target) {
    game.embers.push({
      x: Math.random() * game.width,
      y: Math.random() * game.height,
      speed: game.cell * (0.3 + Math.random() * 0.6),
      size: 0.04 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2
    });
  }
  game.embers.length = Math.min(game.embers.length, target);
}

/**
 * 💍 Cria um efeito de anel.
 * @param {number} x - Posição X.
 * @param {number} y - Posição Y.
 * @param {string} color - Cor.
 * @param {number} reach - Alcance.
 * @param {number} width - Largura.
 */
function spawnRing(x, y, color, reach, width = 0.14) {
  if (!hasEffects()) return;
  game.rings.push({ x, y, color, reach, width, life: 1 });
}

/**
 * 🔄 Reinicia uma animação CSS.
 * @param {HTMLElement} element - Elemento.
 * @param {string} name - Classe da animação.
 */
function retrigger(element, name) {
  element.classList.remove(name);
  void element.offsetWidth;
  element.classList.add(name);
}

/**
 * 🎉 Anima a barra de navegação.
 */
function celebrateNavbar() {
  const center = ui.level.offsetLeft + ui.level.offsetWidth / 2;
  ui.navFx.style.setProperty('--fx-x', `${center}px`);
  retrigger(ui.navFx, 'run');
  retrigger(ui.levelValue, 'roll');
  retrigger(ui.brand, 'flash');
}

/**
 * 🎉 Anima a subida de nível.
 */
function celebrateLevel() {
  if (hasEffects()) playLevelEffects();
  vibrate([30, 40, 30]);
}

/**
 * 🎇 Cria efeitos visuais de subida de nível.
 */
function playLevelEffects() {
  const head = game.snake[0];
  const x = head.x * game.cell + game.cell / 2;
  const y = head.y * game.cell + game.cell / 2;
  const reach = Math.max(game.width, game.height);
  spawnBurst(head, COLORS.snake, 28, 1.6);
  spawnRing(x, y, COLORS.snake, reach * 0.7, 0.3);
  spawnRing(x, y, COLORS.star, reach * 0.45, 0.18);
  retrigger(ui.canvas, 'levelup');
  retrigger(ui.level, 'pop');
  retrigger(ui.xp, 'full');
  celebrateNavbar();
  ui.xpFill.style.width = '100%';
  window.setTimeout(updateProgress, 650);
  window.setTimeout(() => ui.xp.classList.remove('full'), 1000);
}

/**
 * ⬆️ Sobe de nível.
 * @param {number} level - Novo nível.
 */
function levelUp(level) {
  game.level = level;
  placeObstacles(LEVEL_OBSTACLES[settings.obstacles] ?? 0);
  applyTheme();
  game.banner = { text: `Nível ${level}`, life: 1, theme: currentTheme() };
  updateProgress();
  syncLives();
  if (level === HEART_MIN_LEVEL) retrigger(ui.lives, 'beat');
  syncEmbers();
  celebrateLevel();
  audio.play('level');
}

/**
 * 🔄 Reinicia o estado do jogo.
 */
function resetGame() {
  const x = Math.floor(game.cols / 2);
  const y = Math.floor(game.rows / 2);
  game.snake = [{ x, y }, { x, y: y + 1 }, { x, y: y + 2 }];
  game.previous = game.snake.map((part) => ({ ...part }));
  game.dir = { x: 0, y: -1 };
  game.queue = [];
  game.interval = settings.speed;
  game.progress = 1;
  game.particles = [];
  game.level = 1;
  game.heart = null;
  game.lives = 0;
  game.ghost = 0;
  game.obstacles = [];
  game.banner = null;
  game.rings = [];
  game.embers = [];
  applyTheme();
  setScore(0);
  syncLives();
  placeStar();
  placeObstacles(Math.round(game.cols * game.rows * (OBSTACLE_DENSITY[settings.obstacles] ?? 0)));
}

/**
 * 🔄 Enfileira uma curva.
 * @param {number} x - Direção X.
 * @param {number} y - Direção Y.
 */
function queueTurn(x, y) {
  const reference = game.queue.at(-1) ?? game.dir;
  const isReverse = x === -reference.x && y === -reference.y;
  const isSame = x === reference.x && y === reference.y;
  if (isReverse || isSame || game.queue.length >= MAX_QUEUED_TURNS) return;
  game.queue.push({ x, y });
}

/**
 * 💥 Cria uma explosão de partículas.
 * @param {Object} target - Alvo.
 * @param {string} color - Cor.
 * @param {number} count - Quantidade.
 * @param {number} force - Força.
 */
function spawnBurst(target, color = COLORS.star, count = 12, force = 1) {
  if (!hasEffects()) return;
  const x = target.x * game.cell + game.cell / 2;
  const y = target.y * game.cell + game.cell / 2;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = game.cell * (1.5 + Math.random() * 2.5) * force;
    game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
  }
}

/**
 * ⭐ Ação de comer a estrela.
 */
function eatStar() {
  spawnBurst(game.star);
  spawnRing(game.star.x * game.cell + game.cell / 2, game.star.y * game.cell + game.cell / 2, COLORS.star, game.cell * 2.2);
  setScore(game.score + 1);
  audio.play('eat');
  game.interval = Math.max(MIN_INTERVAL, game.interval - SPEED_STEP);
  placeStar();
  if (levelFor(game.score) > game.level) levelUp(levelFor(game.score));
  maybePlaceHeart();
  vibrate(15);
}

/**
 * ❤️ Ação de comer o coração.
 */
function eatHeart() {
  const { x, y } = game.heart;
  spawnBurst(game.heart, COLORS.heart, 18, 1.2);
  spawnRing(x * game.cell + game.cell / 2, y * game.cell + game.cell / 2, COLORS.heart, game.cell * 2.8, 0.16);
  game.heart = null;
  setLives(game.lives + 1);
  audio.play('heart');
  vibrate([15, 30, 15]);
}

/**
 * 💔 Ação de perder uma vida.
 */
function loseLife() {
  const head = game.snake[0];
  spawnBurst(head, COLORS.heart, 18, 1.3);
  spawnRing(head.x * game.cell + game.cell / 2, head.y * game.cell + game.cell / 2, COLORS.heart, game.cell * 3, 0.2);
  setLives(game.lives - 1);
  retrigger(ui.canvas, 'shake');
  audio.play('life');
  vibrate([40, 30, 40]);
}

/**
 * 🔄 Resolve o próximo passo da cobra.
 * @param {Object} dir - Direção.
 * @param {boolean} [ghost] - Modo fantasma.
 * @returns {Object} Resultado do passo.
 */
function resolveStep(dir, ghost = game.ghost > 0) {
  const head = game.snake[0];
  const step = { x: head.x + dir.x, y: head.y + dir.y };
  const outside = step.x < 0 || step.y < 0 || step.x >= game.cols || step.y >= game.rows;
  const next = { x: (step.x + game.cols) % game.cols, y: (step.y + game.rows) % game.rows };
  const eating = game.star !== null && samePosition(next, game.star);
  const body = eating ? game.snake : game.snake.slice(0, -1);
  const fatal =
    (outside && Boolean(settings.walls)) ||
    isObstacle(next) ||
    (!ghost && body.some((part) => samePosition(part, next)));
  return { next, eating, fatal };
}

/**
 * 🏃 Encontra uma rota de fuga.
 * @returns {Object|null} Rota ou nulo.
 */
function findEscape() {
  const { x, y } = game.dir;
  const turns = [{ x: -y, y: x }, { x: y, y: -x }];
  if (Math.random() < 0.5) turns.reverse();
  for (const dir of [game.dir, ...turns]) {
    const move = resolveStep(dir, true);
    if (!move.fatal) return { dir, move };
  }
  return null;
}

/**
 * ➡️ Avança o estado do jogo.
 */
function advance() {
  if (game.queue.length) {
    game.dir = game.queue.shift();
    audio.play('turn');
  }

  let move = resolveStep(game.dir);
  if (move.fatal) {
    const escape = game.lives > 0 ? findEscape() : null;
    if (!escape) {
      endGame();
      return;
    }
    loseLife();
    game.ghost = GHOST_STEPS;
    game.dir = escape.dir;
    game.queue = [];
    move = escape.move;
  }

  const head = game.snake[0];
  const before = game.snake.map((part) => ({ ...part }));
  game.snake.unshift(move.next);

  if (move.eating) {
    eatStar();
    before.push({ ...before.at(-1) });
  } else {
    game.snake.pop();
  }
  game.previous = [{ ...head }, ...before].slice(0, game.snake.length);

  if (game.ghost > 0 && !game.snake.slice(1).some((part) => samePosition(part, move.next))) game.ghost -= 1;

  if (!game.heart) return;
  if (samePosition(move.next, game.heart)) eatHeart();
  else if (--game.heart.ttl <= 0) game.heart = null;
}

const MENU_COPY = {
  idle: () => {
    const best = bestScore();
    return {
      icon: 'fa-gamepad',
      title: 'Vamos jogar?',
      text: CONTROL_TEXT[settings.control] ?? CONTROL_TEXT[CONTROL.drag],
      stats:
        best > 0
          ? [
              { label: 'Recorde', value: best, best: true, icon: 'fa-trophy' },
              { label: 'Melhor nível', value: bestLevel(), icon: 'fa-bolt' }
            ]
          : [],
      button: 'Jogar',
      buttonIcon: 'fa-play'
    };
  },
  over: () => ({
    icon: 'fa-skull',
    title: 'Fim de jogo',
    text: '',
    stats: [
      { label: 'Estrelas', value: game.score, icon: 'fa-star' },
      { label: 'Nível', value: game.level, icon: 'fa-bolt' },
      { label: 'Recorde', value: bestScore(), best: true, icon: 'fa-trophy' }
    ],
    button: 'Jogar de novo',
    buttonIcon: 'fa-rotate-right'
  }),
  paused: () => ({
    icon: 'fa-pause',
    title: 'Pausado',
    text: 'Toque em continuar ou pressione espaço',
    stats: [
      { label: 'Estrelas', value: game.score, icon: 'fa-star' },
      { label: 'Nível', value: game.level, icon: 'fa-bolt' }
    ],
    button: 'Continuar',
    buttonIcon: 'fa-play'
  })
};

/**
 * 📊 Cria um card de estatística.
 * @param {Object} options - Opções do card.
 * @returns {HTMLElement} Elemento do card.
 */
function createStat({ label, value, best, icon }) {
  const tile = document.createElement('div');
  tile.className = best ? 'stat best' : 'stat';
  const glyph = document.createElement('i');
  glyph.className = `fa-solid ${icon}`;
  glyph.setAttribute('aria-hidden', 'true');
  const number = document.createElement('strong');
  number.textContent = value;
  const caption = document.createElement('span');
  caption.textContent = label;
  tile.append(glyph, number, caption);
  return tile;
}

/**
 * 🖨️ Exibe o menu na tela.
 * @param {string} mode - Modo do menu.
 */
function showMenu(mode) {
  const copy = MENU_COPY[mode]();
  setLabel(ui.menuTitle, copy.icon, copy.title);
  ui.menuText.textContent = copy.text;
  ui.menuStats.replaceChildren(...copy.stats.map(createStat));
  setLabel(ui.menuButton, copy.buttonIcon, copy.button);
  ui.settingsPanel.hidden = mode === 'paused';
  ui.menu.classList.remove('hide');
  music.fadeTo(MUSIC.menuVolume);
}

/**
 * 🙈 Oculta o menu.
 */
function hideMenu() {
  ui.menu.classList.add('hide');
  music.fadeTo(MUSIC.gameVolume);
}

/**
 * 🎮 Inicia uma nova partida.
 */
function startGame() {
  audio.unlock();
  music.sync();
  audio.play('start');
  resetGame();
  game.state = 'playing';
  game.progress = 0;
  game.lastTick = performance.now();
  hideMenu();
  blurActive();
}

/**
 * ⏸️ Pausa o jogo.
 * @param {Object} [options] - Opções.
 * @param {boolean} [options.silent] - Sem som.
 */
function pauseGame({ silent = false } = {}) {
  if (game.state !== 'playing') return;
  if (!silent) audio.play('pause');
  game.state = 'paused';
  showMenu('paused');
}

/**
 * ▶️ Continua o jogo pausado.
 */
function resumeGame() {
  if (game.state !== 'paused') return;
  audio.play('resume');
  game.state = 'playing';
  game.lastTick = performance.now() - game.progress * game.interval;
  hideMenu();
  blurActive();
}

/**
 * 💀 Finaliza o jogo.
 */
function endGame() {
  game.state = 'over';
  game.progress = 1;
  const isRecord = game.score > 0 && game.score > bestScore();
  if (game.score > 0) addResult(game.score, game.level);
  audio.play('over');
  if (isRecord) window.setTimeout(() => audio.play('record'), 700);
  ui.canvas.classList.remove('shake');
  void ui.canvas.offsetWidth;
  ui.canvas.classList.add('shake');
  vibrate(80);
  window.setTimeout(() => {
    if (game.state === 'over') showMenu('over');
  }, GAME_OVER_DELAY);
}

/**
 * 🖱️ Lida com a ação do botão do menu.
 */
function handleMenuAction() {
  if (game.state === 'paused') resumeGame();
  else startGame();
}

/**
 * 🔄 Interpolação com quebra de borda.
 * @param {number} from - Início.
 * @param {number} to - Fim.
 * @param {number} limit - Limite.
 * @param {number} t - Progresso.
 * @returns {number} Valor interpolado.
 */
function interpolateWrapped(from, to, limit, t) {
  let start = from;
  let end = to;
  if (end - start > 1) start += limit;
  else if (start - end > 1) end += limit;
  return ((lerp(start, end, t) % limit) + limit) % limit;
}

/**
 * 🐍 Calcula os pontos da cobra.
 * @returns {Array<Object>} Pontos.
 */
function snakePoints() {
  const { cell, cols, rows, progress } = game;
  return game.snake.map((part, index) => {
    const from = game.previous[index] ?? part;
    return {
      x: interpolateWrapped(from.x, part.x, cols, progress) * cell + cell / 2,
      y: interpolateWrapped(from.y, part.y, rows, progress) * cell + cell / 2
    };
  });
}

/**
 * 🎨 Desenha os pontos do tabuleiro (estático).
 */
function drawFlatDots() {
  const { cell, cols, rows } = game;
  const size = cell * 0.09;
  const offset = (cell - size) / 2;
  ctx.fillStyle = COLORS.dot;
  ctx.beginPath();
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) ctx.rect(x * cell + offset, y * cell + offset, size, size);
  }
  ctx.fill();
}

/**
 * 🎨 Desenha os pontos do tabuleiro (dinâmico).
 * @param {Object} head - Cabeça da cobra.
 */
function drawDots(head) {
  if (!hasEffects()) {
    drawFlatDots();
    return;
  }
  const { cell, cols, rows, star } = game;
  const starX = star ? star.x * cell + cell / 2 : -1e4;
  const starY = star ? star.y * cell + cell / 2 : -1e4;

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const px = x * cell + cell / 2;
      const py = y * cell + cell / 2;
      const glow = (cx, cy, reach) => Math.max(0, 1 - Math.hypot(px - cx, py - cy) / cell / reach);
      const snakeGlow = glow(head.x, head.y, 3.2);
      const starGlow = glow(starX, starY, 2.4);
      const useStar = starGlow > snakeGlow;
      const strength = useStar ? starGlow : snakeGlow;

      if (strength > 0.02) {
        const rgb = useStar ? '255, 217, 61' : game.rgb;
        ctx.fillStyle = `rgba(${rgb}, ${0.18 + strength * 0.55})`;
      } else {
        ctx.fillStyle = COLORS.dot;
      }
      ctx.beginPath();
      ctx.arc(px, py, cell * 0.045 + strength * cell * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * ⭐ Desenha a estrela.
 * @param {number} now - Timestamp.
 */
function drawStar(now) {
  if (!game.star) return;
  const { cell } = game;
  const cx = game.star.x * cell + cell / 2;
  const cy = game.star.y * cell + cell / 2;
  const radius = cell * 0.34 * (1 + Math.sin(now / Math.max(110, 220 - game.level * 12)) * (0.08 + game.glow * 0.06));
  const rotation = Math.sin(now / 600) * 0.2;

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = rotation + (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 ? radius * 0.5 : radius;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = radius * 0.45;
  ctx.strokeStyle = COLORS.star;
  ctx.fillStyle = COLORS.star;
  if (hasEffects()) {
    ctx.shadowColor = COLORS.starGlow;
    ctx.shadowBlur = cell * (0.55 + game.glow * 0.5);
  }
  ctx.stroke();
  ctx.fill();
  ctx.shadowBlur = 0;
}

/**
 * ⭕ Adiciona um círculo considerando a quebra de borda.
 * @param {Object} point - Ponto.
 * @param {number} radius - Raio.
 */
function addCircle(point, radius) {
  const x = ((point.x % game.width) + game.width) % game.width;
  const y = ((point.y % game.height) + game.height) % game.height;
  for (const offsetX of [-game.width, 0, game.width]) {
    for (const offsetY of [-game.height, 0, game.height]) {
      const cx = x + offsetX;
      const cy = y + offsetY;
      const visible = cx > -radius && cy > -radius && cx < game.width + radius && cy < game.height + radius;
      if (!visible) continue;
      ctx.moveTo(cx + radius, cy);
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    }
  }
}

/**
 * 🐍 Desenha a cobra.
 * @param {Array<Object>} points - Pontos.
 * @param {boolean} dead - Se está morta.
 * @param {number} now - Timestamp.
 * @returns {Object} Cabeça.
 */
function drawSnake(points, dead, now) {
  const { cell } = game;
  const last = Math.max(points.length - 1, 1);
  const color = dead ? COLORS.snakeDead : COLORS.snake;
  const phase = game.ghost > 0 && !dead ? 0.5 + 0.18 * Math.sin(now / 90) : 1;
  const prism = game.level >= PRISM_LEVEL && !dead;
  const effects = hasEffects();

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';

  if (effects && settings.glow && !dead && game.glow > 0.08) {
    ctx.shadowColor = `rgba(${game.rgb}, ${0.35 + game.glow * 0.5})`;
    ctx.shadowBlur = cell * (0.2 + game.glow * 0.9);
  }

  for (let i = points.length - 1; i >= 0; i--) {
    const fade = i / last;
    ctx.globalAlpha = (effects ? 1 - fade * 0.25 : 1) * phase;
    if (prism) {
      ctx.fillStyle = hsl(game.hue + i * PRISM_SEGMENT_HUE, 100, 68);
      ctx.strokeStyle = ctx.fillStyle;
    }
    ctx.beginPath();
    addCircle(points[i], cell * (0.46 - fade * 0.2));
    ctx.fill();

    const next = points[i + 1];
    const connected = next && Math.hypot(points[i].x - next.x, points[i].y - next.y) < cell * 1.6;
    if (connected) {
      ctx.lineWidth = cell * (0.46 - ((i + 0.5) / last) * 0.2) * 1.7;
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
  if (effects && !dead && game.level >= 3) drawShimmer(points, now);
  ctx.globalAlpha = 1;
  return points[0];
}

/**
 * ✨ Desenha o brilho da cobra.
 * @param {Array<Object>} points - Pontos.
 * @param {number} now - Timestamp.
 */
function drawShimmer(points, now) {
  const { cell } = game;
  const last = Math.max(points.length - 1, 1);
  ctx.fillStyle = '#ffffff';
  points.forEach((point, i) => {
    const wave = 0.5 + 0.5 * Math.sin(now / 130 - i * 0.7);
    if (wave < 0.65) return;
    ctx.globalAlpha = (wave - 0.65) * 0.9;
    ctx.beginPath();
    addCircle(point, cell * (0.24 - (i / last) * 0.1));
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/**
 * ✨ Desenha as brasas no fundo.
 * @param {number} now - Timestamp.
 * @param {number} dt - Delta time.
 */
function drawEmbers(now, dt) {
  for (const ember of game.embers) {
    ember.y -= ember.speed * dt;
    if (ember.y < -game.cell) {
      ember.y = game.height + game.cell;
      ember.x = Math.random() * game.width;
    }
    const alpha = 0.18 + 0.3 * (0.5 + 0.5 * Math.sin(now / 500 + ember.phase));
    ctx.fillStyle = `rgba(${game.rgb}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(ember.x + Math.sin(now / 900 + ember.phase) * game.cell * 0.3, ember.y, game.cell * ember.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 💍 Desenha os anéis de efeito.
 * @param {number} dt - Delta time.
 */
function drawRings(dt) {
  game.rings = game.rings.filter((ring) => ring.life > 0);
  for (const ring of game.rings) {
    ring.life -= dt * 1.6;
    const life = Math.max(ring.life, 0);
    ctx.globalAlpha = life;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = game.cell * ring.width * life + 0.5;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.reach * (1 - life), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * ✨ Emite partículas de rastro.
 * @param {Array<Object>} points - Pontos.
 */
function emitTrail(points) {
  if (game.state !== 'playing' || game.level < 3 || reduceMotion || !hasEffects()) return;
  if (Math.random() > Math.min(0.6, 0.12 * game.level)) return;
  const tail = points.at(-1);
  const angle = Math.random() * Math.PI * 2;
  const speed = game.cell * (0.4 + Math.random() * 0.8);
  game.particles.push({ x: tail.x, y: tail.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.8, color: COLORS.snake });
}

/**
 * ✨ Desenha as partículas.
 * @param {number} dt - Delta time.
 */
function drawParticles(dt) {
  game.particles = game.particles.filter((particle) => particle.life > 0);
  for (const particle of game.particles) {
    ctx.fillStyle = particle.color;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt * 2.4;
    const radius = Math.max(0, game.cell * 0.09 * particle.life);
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * 👀 Desenha os olhos da cobra.
 * @param {Object} head - Cabeça.
 * @param {boolean} dead - Se está morta.
 */
function drawEyes(head, dead) {
  const { cell, dir } = game;
  const side = { x: -dir.y, y: dir.x };
  const reach = cell * 0.14;

  for (const sign of [-1, 1]) {
    const x = head.x + dir.x * reach + side.x * sign * reach;
    const y = head.y + dir.y * reach + side.y * sign * reach;

    if (dead) {
      const arm = cell * 0.075;
      ctx.strokeStyle = COLORS.eyeDead;
      ctx.lineWidth = cell * 0.045;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - arm, y - arm);
      ctx.lineTo(x + arm, y + arm);
      ctx.moveTo(x + arm, y - arm);
      ctx.lineTo(x - arm, y + arm);
      ctx.stroke();
    } else {
      ctx.fillStyle = COLORS.eye;
      ctx.beginPath();
      ctx.arc(x, y, cell * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(x - cell * 0.025, y - cell * 0.025, cell * 0.022, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * ⬛ Desenha um retângulo arredondado.
 * @param {number} x - X.
 * @param {number} y - Y.
 * @param {number} width - Largura.
 * @param {number} height - Altura.
 * @param {number} radius - Raio.
 */
function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * 🧱 Desenha os obstáculos.
 */
function drawObstacles() {
  const { cell } = game;
  const size = cell * 0.68;
  const inner = size * 0.6;

  for (const obstacle of game.obstacles) {
    const x = obstacle.x * cell + (cell - size) / 2;
    const y = obstacle.y * cell + (cell - size) / 2;
    roundedRect(x, y, size, size, cell * 0.18);
    ctx.fillStyle = COLORS.obstacle;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = COLORS.obstacleEdge;
    ctx.stroke();
    roundedRect(x + (size - inner) / 2, y + (size - inner) / 2, inner, inner, cell * 0.1);
    ctx.fillStyle = COLORS.obstacleInner;
    ctx.fill();
  }
}

/**
 * ❤️ Cria o gradiente do coração.
 * @param {number} size - Tamanho.
 * @returns {CanvasGradient} Gradiente.
 */
function heartGradient(size) {
  const gradient = ctx.createRadialGradient(-size * 0.35, -size * 0.45, size * 0.1, 0, 0, size * 1.3);
  gradient.addColorStop(0, COLORS.heartLight);
  gradient.addColorStop(0.45, COLORS.heart);
  gradient.addColorStop(1, '#c2264a');
  return gradient;
}

/**
 * ❤️ Desenha o coração.
 * @param {number} now - Timestamp.
 */
function drawHeart(now) {
  const { heart, cell } = game;
  if (!heart) return;
  if (heart.ttl <= HEART_BLINK_STEPS && Math.floor(now / 130) % 2) return;
  const pulse = Math.max(0, Math.sin(now / 170)) ** 3;
  const size = cell * 0.36 * (1 + pulse * 0.2);
  const effects = hasEffects();

  ctx.save();
  ctx.translate(heart.x * cell + cell / 2, heart.y * cell + cell / 2 + size * 0.1);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.95);
  ctx.bezierCurveTo(-size * 1.6, -size * 0.1, -size * 0.8, -size * 1.25, 0, -size * 0.45);
  ctx.bezierCurveTo(size * 0.8, -size * 1.25, size * 1.6, -size * 0.1, 0, size * 0.95);
  ctx.closePath();
  ctx.fillStyle = effects ? heartGradient(size) : COLORS.heart;
  if (effects) {
    ctx.shadowColor = COLORS.heartGlow;
    ctx.shadowBlur = cell * (0.5 + pulse * 0.4);
  }
  ctx.fill();
  ctx.restore();
}

/**
 * 🏷️ Cria o gradiente do banner.
 * @param {Object} banner - Banner.
 * @param {number} half - Metade da largura.
 * @returns {CanvasGradient} Gradiente.
 */
function bannerGradient(banner, half) {
  const gradient = ctx.createLinearGradient(-half, 0, half, 0);
  if (banner.theme.prism) {
    [0, 0.25, 0.5, 0.75, 1].forEach((stop) => gradient.addColorStop(stop, hsl(game.hue + stop * 300, 100, 76)));
  } else {
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, banner.theme.accent);
    gradient.addColorStop(0.75, banner.theme.snake);
    gradient.addColorStop(1, '#ffffff');
  }
  return gradient;
}

/**
 * 🏷️ Desenha o banner de nível.
 * @param {number} dt - Delta time.
 */
function drawBanner(dt) {
  const banner = game.banner;
  if (!banner) return;
  banner.life -= dt * 0.7;
  if (banner.life <= 0) {
    game.banner = null;
    return;
  }

  ctx.save();
  ctx.globalAlpha = Math.min(1, banner.life * 2.5);
  ctx.translate(game.width / 2, game.height / 2);
  const scale = 1 + (1 - banner.life) * 0.12;
  ctx.scale(scale, scale);
  ctx.font = `600 ${Math.round(game.cell * 1.3)}px Roboto, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const half = ctx.measureText(banner.text).width / 2;
  if (hasEffects()) {
    ctx.fillStyle = bannerGradient(banner, half);
    ctx.shadowColor = `rgba(${banner.theme.rgb}, 0.85)`;
    ctx.shadowBlur = game.cell * 0.7;
  } else {
    ctx.fillStyle = banner.theme.accent;
  }
  ctx.fillText(banner.text, 0, 0);
  ctx.restore();
}

/**
 * 🖨️ Renderiza o quadro atual.
 * @param {number} now - Timestamp.
 * @param {number} dt - Delta time.
 */
function render(now, dt) {
  tickPrism(now);
  ctx.clearRect(0, 0, game.width, game.height);
  const points = snakePoints();
  const dead = game.state === 'over';

  drawDots(points[0]);
  drawEmbers(now, dt);
  drawObstacles();
  drawStar(now);
  drawHeart(now);
  const head = drawSnake(points, dead, now);
  drawEyes(head, dead);
  emitTrail(points);
  drawParticles(dt);
  drawRings(dt);
  drawBanner(dt);
}

/**
 * 🔄 Loop principal do jogo.
 * @param {number} now - Timestamp.
 */
function frame(now) {
  if (game.state === 'playing') {
    if (now - game.lastTick > game.interval * 5) game.lastTick = now;
    while (game.state === 'playing' && now - game.lastTick >= game.interval) {
      game.lastTick += game.interval;
      advance();
    }
    if (game.state === 'playing') {
      game.progress = clamp((now - game.lastTick) / game.interval, 0, 1);
    }
  }
  const dt = Math.min((now - (game.lastFrame || now)) / 1000, 0.05);
  game.lastFrame = now;
  render(now, dt);
  requestAnimationFrame(frame);
}

const swipe = { pointerId: null, x: 0, y: 0 };

/**
 * 🖐️ Lida com o gesto de arrastar.
 * @param {number} x - Posição X.
 * @param {number} y - Posição Y.
 */
function handleSwipe(x, y) {
  const dx = x - swipe.x;
  const dy = y - swipe.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < settings.sens * view.scale) return;
  if (Math.abs(dx) > Math.abs(dy)) queueTurn(dx > 0 ? 1 : -1, 0);
  else queueTurn(0, dy > 0 ? 1 : -1);
  swipe.x = x;
  swipe.y = y;
}

ui.stage.addEventListener('pointerdown', (event) => {
  if (settings.control !== CONTROL.drag || !event.isPrimary || event.target.closest('button, input, a')) return;
  Object.assign(swipe, { pointerId: event.pointerId, x: event.clientX, y: event.clientY });
  ui.stage.setPointerCapture(event.pointerId);
});

ui.stage.addEventListener('pointermove', (event) => {
  if (event.pointerId !== swipe.pointerId || game.state !== 'playing') return;
  handleSwipe(event.clientX, event.clientY);
});

const releaseSwipe = (event) => {
  if (event.pointerId === swipe.pointerId) swipe.pointerId = null;
};

/**
 * 🎯 Escolhe a tecla de direção do D-pad.
 * @param {Object} pad - D-pad.
 * @param {number} dx - Delta X.
 * @param {number} dy - Delta Y.
 * @returns {string} Tecla.
 */
function pickDirectionKey(pad, dx, dy) {
  const bias = pad.horizontal === null ? 1 : pad.horizontal ? 1 / DPAD_AXIS_BIAS : DPAD_AXIS_BIAS;
  pad.horizontal = Math.abs(dx) > Math.abs(dy) * bias;
  if (pad.horizontal) return dx > 0 ? 'arrowright' : 'arrowleft';
  return dy > 0 ? 'arrowdown' : 'arrowup';
}

const dpad = { pointerId: null, key: null, horizontal: null };

/**
 * 🎯 Define a tecla ativa do D-pad.
 * @param {string|null} key - Tecla.
 */
function setDpadKey(key) {
  if (key === dpad.key) return;
  dpad.key = key;
  ui.dpadKeys.forEach((element) => element.classList.toggle('on', element.dataset.key === key));
  if (key) ui.dpad.dataset.dir = key;
  else delete ui.dpad.dataset.dir;
  if (!key) return;
  vibrate(6);
  if (game.state !== 'playing') return;
  const { x, y } = DIRECTION_KEYS[key];
  queueTurn(x, y);
}

/**
 * 📏 Calcula o offset do D-pad.
 * @param {PointerEvent} event - Evento.
 * @returns {Object} Offset.
 */
function dpadOffset(event) {
  const rect = ui.dpad.getBoundingClientRect();
  return {
    dx: event.clientX - (rect.left + rect.width / 2),
    dy: event.clientY - (rect.top + rect.height / 2),
    size: rect.width
  };
}

/**
 * 🎯 Direciona o D-pad.
 * @param {Object} offset - Offset.
 */
function steerDpad({ dx, dy, size }) {
  if (Math.hypot(dx, dy) < size * DPAD_DEADZONE) {
    dpad.horizontal = null;
    setDpadKey(null);
    return;
  }
  setDpadKey(pickDirectionKey(dpad, dx, dy));
}

/**
 * 🎯 Libera o D-pad.
 * @param {PointerEvent} event - Evento.
 */
function releaseDpad(event) {
  if (event.pointerId !== dpad.pointerId) return;
  dpad.pointerId = null;
  dpad.horizontal = null;
  setDpadKey(null);
}

ui.dpad.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary) return;
  event.preventDefault();
  const offset = dpadOffset(event);
  if (Math.min(Math.abs(offset.dx), Math.abs(offset.dy)) > offset.size * DPAD_HIT) return;
  dpad.pointerId = event.pointerId;
  ui.dpad.setPointerCapture(event.pointerId);
  steerDpad(offset);
});

ui.dpad.addEventListener('pointermove', (event) => {
  if (event.pointerId === dpad.pointerId) steerDpad(dpadOffset(event));
});

ui.dpad.addEventListener('pointerup', releaseDpad);
ui.dpad.addEventListener('pointercancel', releaseDpad);

ui.stage.addEventListener('pointerup', releaseSwipe);
ui.stage.addEventListener('pointercancel', releaseSwipe);

/**
 * ⌨️ Lida com teclas de ação.
 * @param {string} key - Tecla.
 */
function handleActionKey(key) {
  if (key === ' ') {
    if (game.state === 'playing') pauseGame();
    else handleMenuAction();
  } else if (key === 'enter') {
    if (game.state !== 'playing') handleMenuAction();
  } else if (key === 'p' || key === 'escape') {
    if (game.state === 'playing') pauseGame();
    else if (game.state === 'paused' && key === 'p') resumeGame();
  }
}

window.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]')) return;
  const key = event.key.toLowerCase();
  if (event.target === ui.updateButton && (key === 'enter' || key === ' ')) return;

  if (isHistoryOpen()) {
    if (key === 'escape') closeHistory();
    return;
  }

  if (key === 'm') {
    toggleSound();
    return;
  }

  const direction = DIRECTION_KEYS[key];
  if (direction) {
    event.preventDefault();
    if (game.state === 'idle') startGame();
    if (game.state === 'playing') queueTurn(direction.x, direction.y);
    return;
  }

  if ([' ', 'enter', 'p', 'escape'].includes(key)) {
    event.preventDefault();
    if (!event.repeat) handleActionKey(key);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseGame({ silent: true });
    music.persist();
    audio.context?.suspend().catch(() => {});
  } else {
    audio.context?.resume().catch(() => {});
  }
});

window.addEventListener('pagehide', () => music.persist());

const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
const releaseUnlock = () => UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, unlockAudio, true));

/**
 * 🔊 Desbloqueia o áudio.
 */
function unlockAudio() {
  music.sync();
  const { context } = audio;
  if (!context) {
    releaseUnlock();
    return;
  }
  context
    .resume()
    .then(() => {
      if (context.state === 'running') releaseUnlock();
    })
    .catch(() => {});
}

UNLOCK_EVENTS.forEach((type) => window.addEventListener(type, unlockAudio, true));
audio.context?.addEventListener('statechange', () => {
  if (audio.context.state === 'running') releaseUnlock();
  else UNLOCK_EVENTS.forEach((type) => window.addEventListener(type, unlockAudio, true));
});

/**
 * 🔄 Volta ao estado inicial.
 */
function resetToIdle() {
  game.state = 'idle';
  resetGame();
  showMenu('idle');
}

const refit = () => {
  applyScale();
  if (layout()) resetToIdle();
};

window.addEventListener('resize', refit);
window.addEventListener('load', refit);
if ('ResizeObserver' in window) new ResizeObserver(refit).observe(ui.stage);

/**
 * 🔇 Alterna o som.
 */
function toggleSound() {
  settings.sound = settings.sound ? 0 : 1;
  storage.write(STORAGE_KEYS.settings, settings);
  syncSettings();
  audio.play('tap');
}

/**
 * 🎨 Aplica as configurações gráficas.
 */
function applyGraphics() {
  layout();
  applyTheme();
  syncEmbers();
}

/**
 * ⚙️ Sincroniza a UI com as configurações atuais.
 */
function syncSettings() {
  document.documentElement.classList.toggle('basic', !hasEffects());
  ui.canvas.classList.toggle('solid', Boolean(settings.walls));
  ui.dpad.hidden = settings.control !== CONTROL.dpad;
  ui.sensRow.hidden = settings.control !== CONTROL.drag;
  ui.glowRow.hidden = !hasEffects();
  ui.volume.value = String(settings.volume);
  ui.volume.style.setProperty('--fill', `${settings.volume}%`);
  ui.volumeValue.textContent = `${settings.volume}%`;
  ui.volumeIcon.className = `fa-solid ${
    settings.volume === 0 ? 'fa-volume-xmark' : settings.volume < 50 ? 'fa-volume-low' : 'fa-volume-high'
  }`;
  ui.toggles.forEach((button) => {
    const on = Boolean(settings[button.dataset.setting]);
    button.classList.toggle('on', on);
    button.setAttribute('aria-pressed', String(on));
    if (button.dataset.off) button.firstElementChild.className = `fa-solid ${on ? button.dataset.on : button.dataset.off}`;
  });
  document.querySelectorAll('.segmented').forEach((group) => {
    const key = group.dataset.setting;
    const buttons = [...group.querySelectorAll('button')];
    let activeIndex = 0;
    buttons.forEach((button, index) => {
      const selected = Number(button.dataset.value) === settings[key];
      button.classList.toggle('on', selected);
      button.classList.toggle('off', selected && OFF_VALUES[key] === Number(button.dataset.value));
      if (selected) activeIndex = index;
    });
    group.style.setProperty('--thumb-index', String(activeIndex));
    group.style.setProperty('--thumb-count', String(buttons.length));
    group.classList.toggle('is-off', buttons[activeIndex].classList.contains('off'));
  });
}

document.querySelectorAll('.segmented button').forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.parentElement.dataset.setting;
    settings[key] = Number(button.dataset.value);
    storage.write(STORAGE_KEYS.settings, settings);
    syncSettings();
    if (key === 'control') {
      layout();
      resetToIdle();
    }
    if (key === 'graphics') applyGraphics();
    audio.play('tap');
  });
});

ui.toggles.forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.setting;
    settings[key] = settings[key] ? 0 : 1;
    storage.write(STORAGE_KEYS.settings, settings);
    syncSettings();
    if (key === 'music') music.sync();
    audio.play('tap');
  });
});

ui.volume.addEventListener('input', () => {
  settings.volume = Number(ui.volume.value);
  syncSettings();
  audio.setVolume();
});

ui.volume.addEventListener('change', () => {
  storage.write(STORAGE_KEYS.settings, settings);
  audio.play('tap');
});

ui.settingsOpen.addEventListener('click', () => ui.settingsDialog.showModal());
ui.settingsClose.addEventListener('click', () => ui.settingsDialog.close());
ui.settingsDialog.addEventListener('click', (event) => {
  if (event.target === ui.settingsDialog) ui.settingsDialog.close();
});
ui.settingsDialog.addEventListener('close', blurActive);
ui.guideOpen.addEventListener('click', openGuide);
ui.guideClose.addEventListener('click', () => ui.guideDialog.close());
ui.guideDialog.addEventListener('click', (event) => {
  if (event.target === ui.guideDialog) ui.guideDialog.close();
});
ui.guideDialog.addEventListener('close', blurActive);
ui.guideTabs.addEventListener('click', (event) => {
  const tab = event.target.closest('.guide-tab');
  if (!tab) return;
  audio.play('tap');
  selectGuideSection(Number(tab.dataset.index));
});
ui.menuButton.addEventListener('click', handleMenuAction);
ui.historyOpen.addEventListener('click', openHistory);
ui.historyClose.addEventListener('click', closeHistory);
ui.historyClear.addEventListener('click', clearHistory);
ui.historyList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (button) removeResult(button.dataset.id);
});

const CACHE_PREFIX = 'xnaja-';
const VERSION_PATTERN = /const\s+CACHE\s*=\s*['"]([^'"]+)['"]/;
const VERSION_CHECK_MS = 5 * 60 * 1000;
const release = { current: null, latest: null, busy: false };

const formatVersion = (name) => (name.startsWith(CACHE_PREFIX) ? name.slice(CACHE_PREFIX.length) : name);

/**
 * 🗄️ Lê a versão instalada do cache.
 * @returns {Promise<string|null>} Versão.
 */
async function readInstalledVersion() {
  try {
    const keys = (await caches.keys()).filter((key) => key.startsWith(CACHE_PREFIX));
    keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return keys[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * 📡 Busca a versão mais recente do sw.js.
 * @returns {Promise<string|null>} Versão.
 */
async function fetchLatestVersion() {
  try {
    const response = await fetch(`sw.js?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.text()).match(VERSION_PATTERN)?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * 🖨️ Renderiza o status da versão na UI.
 */
function renderVersion() {
  const shown = release.current ?? release.latest;
  ui.version.hidden = !shown;
  if (shown) setLabel(ui.version, 'fa-code-branch', formatVersion(shown));
  const outdated = Boolean(release.current && release.latest && release.current !== release.latest);
  ui.updateButton.hidden = !outdated;
  if (outdated && !release.busy) {
    setLabel(ui.updateButton, 'fa-cloud-arrow-down', `Atualizar para ${formatVersion(release.latest)}`);
  }
}

/**
 * 🔄 Verifica se há atualizações disponíveis.
 */
async function checkVersion() {
  if (release.busy) return;
  release.latest = await fetchLatestVersion();
  release.current = await readInstalledVersion();
  renderVersion();
  if (release.current || !('serviceWorker' in navigator)) return;
  await navigator.serviceWorker.ready;
  release.current = await readInstalledVersion();
  renderVersion();
}

/**
 * ⬇️ Aplica a atualização do jogo.
 */
async function applyUpdate() {
  if (release.busy) return;
  release.busy = true;
  ui.updateButton.disabled = true;
  setLabel(ui.updateButton, 'fa-spinner fa-spin', 'Atualizando');
  audio.play('tap');

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)));
    }
  } catch {
    release.busy = false;
    ui.updateButton.disabled = false;
    setLabel(ui.updateButton, 'fa-triangle-exclamation', 'Falha ao atualizar, tentar de novo');
    return;
  }

  const target = new URL(window.location.href);
  target.searchParams.set(UPDATE_PARAM, Date.now().toString(36));
  window.location.replace(target);
}

ui.updateButton.addEventListener('click', applyUpdate);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkVersion();
});
window.setInterval(checkVersion, VERSION_CHECK_MS);

applyScale();
renderGuideTabs();
syncSettings();
layout();
resetToIdle();
requestAnimationFrame(frame);

requestAnimationFrame(() => {
  document.querySelectorAll('.segmented').forEach((group) => group.classList.add('ready'));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}).finally(checkVersion);
  });
}