const ICON_ANIMATIONS = {
  'fa-github': { rotate: [-10, 10, -10, 0], duration: 500, easing: 'easeInOutQuad' }
};

const DEFAULT_ICON_ANIMATION = { scale: [1, 1.2, 1], duration: 400, easing: 'easeOutQuad' };

const MENU_ICON_CONTAINERS = '.menu .pill, .menu .toggle, .menu .action-button, .menu .primary, .menu .segmented button, .menu .guide-tab, .menu .icon-button';

function iconAnimation(icon) {
  for (const cls of icon.classList) {
    if (ICON_ANIMATIONS[cls]) return ICON_ANIMATIONS[cls];
  }
  return DEFAULT_ICON_ANIMATION;
}

function playIconAnimation(icon) {
  if (!window.anime || icon.classList.contains('fa-spin')) return;
  anime.remove(icon);
  anime({
    targets: icon,
    ...iconAnimation(icon),
    complete: () => icon.style.removeProperty('transform')
  });
}

function findIcon(container) {
  return container.querySelector('i');
}

function initIconAnimations() {
  if (!window.anime || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('pointerover', (event) => {
    if (event.pointerType !== 'mouse') return;
    const container = event.target.closest(MENU_ICON_CONTAINERS);
    if (!container || container.contains(event.relatedTarget)) return;
    const icon = findIcon(container);
    if (icon) playIconAnimation(icon);
  });

  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    const container = event.target.closest(MENU_ICON_CONTAINERS);
    if (!container) return;
    const icon = findIcon(container);
    if (icon) playIconAnimation(icon);
  });

  document.addEventListener('focusin', (event) => {
    const container = event.target.closest(MENU_ICON_CONTAINERS);
    if (!container) return;
    const icon = findIcon(container);
    if (icon) playIconAnimation(icon);
  });
}

initIconAnimations();