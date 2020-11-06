const replButtons = document.querySelectorAll('button[data-repl]');

replButtons.forEach(replButton => {
  replButton.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    const windowHeight = window.innerHeight - 100;
    iframe.src = replButton.dataset.repl;
    iframe.title = 'Svelte REPL';
    iframe.width = '100%';
    iframe.height = (windowHeight > 800 ? 800 : windowHeight) + 'px';
    replButton.replaceWith(iframe);
  });
});
