import {spring} from 'svelte/motion';

function getPrefersReducedMotion() {
  const QUERY = '(prefers-reduced-motion: no-preference)';
  const mediaQueryList = window.matchMedia(QUERY);
  const prefersReducedMotion = !mediaQueryList.matches;
  return prefersReducedMotion;
}

export default function boop(
  node,
  {x = 0, y = 0, rotation = 0, scale = 1, timing = 150, boopElement}
) {
  if (getPrefersReducedMotion()) return;

  node.addEventListener('mouseenter', handleMouseEnter);
  // only for demo purposes on mobile
  node.addEventListener('click', handleMouseEnter);

  let timeoutId;
  const springyRotation = spring(
    {x: 0, y: 0, rotation: 0, scale: 1},
    {
      stiffness: 0.1,
      damping: 0.15
    }
  );

  const unsubscribe = springyRotation.subscribe(transformElement);

  function handleMouseEnter() {
    clearTimeout(timeoutId);
    springyRotation.set({x, y, rotation, scale});

    timeoutId = setTimeout(() => {
      springyRotation.set({x: 0, y: 0, rotation: 0, scale: 1});
    }, timing);
  }

  function transformElement({x, y, rotation, scale}) {
    const element = boopElement || node;
    element.style.display = 'inline-block';
    element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
  }

  return {
    update(params) {
      ({x = 0, y = 0, rotation = 0, scale = 1, timing = 150, boopElement} = params);
    },
    destroy() {
      clearTimeout(timeoutId);
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('click', handleMouseEnter);
      unsubscribe();
    }
  };
}
