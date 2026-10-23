/**
 * ⚙️ Configurações e constantes globais do jogo XNAJA.
 * @module Config
 */

/**
 * 🎨 Paleta de cores base do jogo.
 * @type {Object}
 */
const COLORS = {
  snake: '#6effa8',
  snakeDead: '#8c8c91',
  star: '#ffd93d',
  dot: 'rgba(255, 255, 255, 0.14)',
  eye: '#04230f',
  eyeDead: '#26262a',
  starGlow: 'rgba(255, 217, 61, 0.7)',
  heart: '#ff5d7a',
  heartLight: '#ffc2cf',
  heartGlow: 'rgba(255, 93, 122, 0.75)',
  obstacle: '#3a3d47',
  obstacleEdge: '#6b707e',
  obstacleInner: '#2a2c34'
};

/**
 * 🌈 Temas de cores dinâmicas conforme o nível avança.
 * @type {Array<Object>}
 */
const THEMES = [
  { snake: '#6effa8', rgb: '110, 255, 168', accent: '#b9ffd6', tint: '#0c1a13' },
  { snake: '#5be3ff', rgb: '91, 227, 255', accent: '#c4f4ff', tint: '#0b1a1f' },
  { snake: '#8c9bff', rgb: '140, 155, 255', accent: '#d3d9ff', tint: '#0e1022' },
  { snake: '#e58cff', rgb: '229, 140, 255', accent: '#f4d4ff', tint: '#190d20' },
  { snake: '#ff8ca8', rgb: '255, 140, 168', accent: '#ffd4df', tint: '#200d14' },
  { snake: '#ffb45e', rgb: '255, 180, 94', accent: '#ffe1bd', tint: '#20150a' }
];

/**
 * 🗄️ Chaves de armazenamento local (localStorage/sessionStorage).
 * @type {Object}
 */
const STORAGE_KEYS = { settings: 'cobrinha:settings', history: 'cobrinha:history', music: 'cobrinha:music', tracks: 'cobrinha:tracks' };

/**
 * 🛠️ Configurações padrão iniciais.
 * @type {Object}
 */
const DEFAULT_SETTINGS = { sens: 18, speed: 200, sound: 1, music: 1, volume: 100, obstacles: 0, walls: 0, control: 0, graphics: 1, glow: 1 };

/**
 * 📐 Dimensões e restrições de layout do tabuleiro.
 * @type {Object}
 */
const LAYOUT = { minCols: 12, minRows: 8, maxCell: 44, maxBoardWidth: 640, maxBoardWidthDesktop: 1280, marginX: 24, marginY: 16, maxRatio: 3, basicMaxRatio: 1.5 };

/**
 * ⏱️ Intervalo mínimo entre os passos da cobra (ms).
 * @type {number}
 */
const MIN_INTERVAL = 80;

/**
 * ⚡ Acréscimo de velocidade a cada estrela comida.
 * @type {number}
 */
const SPEED_STEP = 6;

/**
 * 📜 Limite máximo de partidas no histórico.
 * @type {number}
 */
const MAX_HISTORY = 100;

/**
 * ⏳ Tempo de atraso para exibir o menu de fim de jogo.
 * @type {number}
 */
const GAME_OVER_DELAY = 700;

/**
 * 🔄 Número máximo de curvas enfileiradas.
 * @type {number}
 */
const MAX_QUEUED_TURNS = 3;

/**
 * ⭐ Estrelas necessárias para subir de nível.
 * @type {number}
 */
const STARS_PER_LEVEL = 5;

/**
 * 🎵 Configurações de áudio e música de fundo.
 * @type {Object}
 */
const MUSIC = { dir: 'source/music', name: 'snake', ext: 'mp3', maxTracks: 20, menuVolume: 1, gameVolume: 0.4, fade: 0.2 };

/**
 * ❤️ Nível mínimo para corações aparecerem.
 * @type {number}
 */
const HEART_MIN_LEVEL = 4;

/**
 * 🎲 Chance de gerar um coração por estrela comida.
 * @type {number}
 */
const HEART_CHANCE = 0.35;

/**
 * ⏳ Passos até o coração desaparecer.
 * @type {number}
 */
const HEART_TTL_STEPS = 48;

/**
 * 👁️ Passos para o coração começar a piscar.
 * @type {number}
 */
const HEART_BLINK_STEPS = 14;

/**
 * 🛡️ Limite máximo de vidas extras.
 * @type {number}
 */
const MAX_LIVES = 5;

/**
 * 👻 Passos no modo fantasma ao usar uma vida.
 * @type {number}
 */
const GHOST_STEPS = 6;

/**
 * 💎 Nível para desbloquear o modo prisma.
 * @type {number}
 */
const PRISM_LEVEL = 10;

/**
 * 🎨 Velocidade da mudança de cor no modo prisma.
 * @type {number}
 */
const PRISM_HUE_SPEED = 40;

/**
 * 🌈 Variação de cor por segmento da cobra no modo prisma.
 * @type {number}
 */
const PRISM_SEGMENT_HUE = 14;

/**
 * ⏱️ Intervalo de atualização de cor no modo prisma (ms).
 * @type {number}
 */
const PRISM_STEP_MS = 120;

/**
 * 🧱 Densidade de obstáculos por configuração.
 * @type {Array<number>}
 */
const OBSTACLE_DENSITY = [0, 0.04, 0.08];

/**
 * 🧱 Quantidade de obstáculos adicionados por nível.
 * @type {Array<number>}
 */
const LEVEL_OBSTACLES = [0, 1, 2];

/**
 * 🛑 Distância segura de obstáculos em relação à cabeça.
 * @type {number}
 */
const OBSTACLE_SAFE_RADIUS = 4;

/**
 * 🕹️ Tipos de controle disponíveis.
 * @type {Object}
 */
const CONTROL = { drag: 0, dpad: 1 };

/**
 * 📝 Textos descritivos para os controles.
 * @type {Object}
 */
const CONTROL_TEXT = {
  [CONTROL.drag]: 'Arraste o dedo ou use as setas do teclado',
  [CONTROL.dpad]: 'Use o D-pad ou as setas do teclado'
};

/**
 * 🔗 Configurações ativadas via URL (?m=).
 * @type {Object}
 */
const MODE_SETTINGS = {
  drag: { control: CONTROL.drag },
  dpad: { control: CONTROL.dpad }
};

/**
 * 🔑 Chaves de configuração que podem ser salvas no histórico.
 * @type {Array<string>}
 */
const MODE_KEYS = ['speed', 'obstacles', 'walls', 'control'];

/**
 * 🏷️ Rótulos e ícones para as configurações do histórico.
 * @type {Object}
 */
const MODE_LABELS = {
  speed: {
    320: ['fa-leaf', 'Zen'],
    260: ['fa-person-walking', 'Lenta'],
    200: ['fa-gauge', 'Normal'],
    150: ['fa-gauge-high', 'Rápida'],
    110: ['fa-bolt', 'Turbo']
  },
  obstacles: {
    0: ['fa-ban', 'Sem obstáculos'],
    1: ['fa-cube', 'Poucos obstáculos'],
    2: ['fa-cubes', 'Muitos obstáculos']
  },
  walls: {
    0: ['fa-repeat', 'Bordas atravessam'],
    1: ['fa-border-all', 'Bordas sólidas']
  },
  control: {
    0: ['fa-hand-pointer', 'Arrastar'],
    1: ['fa-arrows-up-down-left-right', 'D-pad']
  }
};

/**
 * ⚠️ Valores que indicam configurações desligadas.
 * @type {Object}
 */
const OFF_VALUES = { sound: 0, glow: 0, obstacles: 0 };

/**
 * 🖥️ Modo de tela imersiva.
 * @type {string}
 */
const IMMERSIVE_MODE = 'fullscreen';

/**
 * 🔄 Parâmetro de URL para atualização forçada.
 * @type {string}
 */
const UPDATE_PARAM = 'u';

/**
 * ⚖️ Viés do eixo para o D-pad.
 * @type {number}
 */
const DPAD_AXIS_BIAS = 1.25;

/**
 * 🎯 Zona morta do D-pad.
 * @type {number}
 */
const DPAD_DEADZONE = 0.14;

/**
 * 👆 Área de toque do D-pad.
 * @type {number}
 */
const DPAD_HIT = 0.24;

/**
 * 🧭 Mapeamento de teclas para direções.
 * @type {Object}
 */
const DIRECTION_KEYS = {
  arrowup: { x: 0, y: -1 },
  arrowdown: { x: 0, y: 1 },
  arrowleft: { x: -1, y: 0 },
  arrowright: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 }
};

/**
 * 📖 Estrutura de fallback caso o guia falhe.
 * @type {Object}
 */
const GUIDE_FALLBACK = { title: 'Guia', icon: 'fa-book-open', sections: [] };

/**
 * 📚 Dados do guia de instruções do jogo.
 * @type {Object}
 */
const guideData = {
  title: "Guia",
  icon: "fa-book-open",
  sections: [
    {
      id: "objective",
      icon: "fa-bullseye",
      title: "Objetivo",
      intro: "Guie a cobrinha, colete estrelas e sobreviva o máximo que conseguir.",
      items: [
        {
          icon: "fa-star",
          tone: "star",
          title: "Coma estrelas",
          text: "Cada estrela vale 1 ponto e faz a cobrinha crescer."
        },
        {
          icon: "fa-skull",
          tone: "danger",
          title: "Evite as batidas",
          text: "O jogo termina ao bater no próprio corpo, em um obstáculo ou em uma borda sólida."
        },
        {
          icon: "fa-gauge-high",
          title: "Ela acelera",
          text: "A cada estrela a cobrinha fica um pouco mais rápida, até um limite."
        },
        {
          icon: "fa-trophy",
          tone: "star",
          title: "Bata seu recorde",
          text: "Seu melhor placar e seu maior nível ficam guardados no aparelho."
        }
      ]
    },
    {
      id: "controls",
      icon: "fa-gamepad",
      title: "Controles",
      items: [
        {
          icon: "fa-hand-pointer",
          title: "Arrastar",
          text: "Deslize o dedo na direção desejada. A sensibilidade pode ser ajustada em Mais ajustes."
        },
        {
          icon: "fa-arrows-up-down-left-right",
          title: "D-pad",
          text: "Use o direcional na tela. Escolha entre Arrastar e D-pad no menu."
        },
        {
          icon: "fa-keyboard",
          title: "Teclado",
          text: "Use as setas ou as teclas de letras para virar.",
          keys: ["Setas", "W A S D"]
        },
        {
          icon: "fa-pause",
          title: "Pausa",
          text: "Pause e continue a qualquer momento.",
          keys: ["Espaço", "P", "Esc"]
        },
        {
          icon: "fa-volume-high",
          title: "Som",
          text: "Liga ou desliga os sons rapidamente.",
          keys: ["M"]
        },
        {
          icon: "fa-forward",
          title: "Curvas em fila",
          text: "Até 3 viradas ficam na fila, então dá para antecipar curvas apertadas."
        }
      ]
    },
    {
      id: "items",
      icon: "fa-star",
      title: "Itens",
      items: [
        {
          icon: "fa-star",
          tone: "star",
          title: "Estrela",
          text: "Aumenta a pontuação, o tamanho e a velocidade."
        },
        {
          icon: "fa-heart",
          tone: "heart",
          tag: "Nível 4+",
          title: "Coração",
          text: "Aparece de vez em quando e some se demorar. Cada coração é uma vida extra, com limite de 5."
        },
        {
          icon: "fa-ghost",
          tone: "muted",
          title: "Modo fantasma",
          text: "Ao usar uma vida extra, a cobrinha desvia sozinha e atravessa o próprio corpo por alguns passos."
        },
        {
          icon: "fa-cube",
          tone: "muted",
          title: "Obstáculos",
          text: "Blocos fixos no tabuleiro. Bater neles é fatal, a menos que você tenha uma vida extra."
        }
      ]
    },
    {
      id: "levels",
      icon: "fa-bolt",
      title: "Níveis",
      intro: "A cada 5 estrelas você sobe de nível.",
      items: [
        {
          icon: "fa-palette",
          title: "Novas cores",
          text: "O visual do jogo muda conforme você avança."
        },
        {
          icon: "fa-cubes",
          title: "Mais obstáculos",
          text: "Com obstáculos ativados, novos blocos surgem ao subir de nível."
        },
        {
          icon: "fa-heart",
          tone: "heart",
          tag: "Nível 4+",
          title: "Vidas extras",
          text: "Os corações passam a aparecer a partir do nível 4."
        },
        {
          icon: "fa-wand-magic-sparkles",
          tag: "Nível 10+",
          title: "Modo prisma",
          text: "A cobrinha ganha um brilho holográfico."
        }
      ]
    },
    {
      id: "settings",
      icon: "fa-sliders",
      title: "Ajustes",
      items: [
        {
          icon: "fa-gauge-high",
          title: "Velocidade inicial",
          text: "De Zen a Turbo. Define o ritmo no começo de cada partida."
        },
        {
          icon: "fa-cubes",
          title: "Obstáculos",
          text: "Escolha entre nenhum, poucos ou muitos blocos no tabuleiro."
        },
        {
          icon: "fa-border-all",
          title: "Bordas",
          text: "Atravessam: a cobrinha reaparece do outro lado. Sólidas: bater na borda termina o jogo."
        },
        {
          icon: "fa-wand-magic-sparkles",
          title: "Gráficos",
          text: "O modo Básico reduz efeitos e animações para rodar melhor em aparelhos simples."
        },
        {
          icon: "fa-clock-rotate-left",
          title: "Histórico",
          text: "As últimas 100 partidas ficam salvas, com os ajustes usados em cada uma."
        }
      ]
    },
    {
      id: "modes",
      icon: "fa-link",
      title: "Modos",
      intro: "Acrescente ao endereço do jogo para abrir em um modo especial. Combine vários separando por vírgula.",
      items: [
        {
          icon: "fa-expand",
          title: "Tela imersiva",
          text: "Deixa só os indicadores no topo e dá mais espaço ao tabuleiro.",
          keys: ["?m=fullscreen"]
        },
        {
          icon: "fa-arrows-up-down-left-right",
          title: "Abrir com D-pad",
          keys: ["?m=dpad"]
        },
        {
          icon: "fa-hand-pointer",
          title: "Abrir com arrasto",
          keys: ["?m=drag"]
        },
        {
          icon: "fa-layer-group",
          title: "Combinando",
          keys: ["?m=fullscreen,dpad"]
        }
      ]
    }
  ]
};