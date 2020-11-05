const replButtons = document.querySelectorAll('button[data-repl]');

replButtons.forEach(replButton => {
  replButton.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = replButton.dataset.repl;
    iframe.title = 'Svelte REPL';
    iframe.width = '100%';
    iframe.height = '800px';
    replButton.replaceWith(iframe);
  });
});
