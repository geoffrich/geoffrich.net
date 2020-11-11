const THEME_KEY = 'theme';

class ThemePicker {
  constructor() {
    this.themeToggle = document.querySelector('.theme-selector-toggle');
    this.themeRadioset = document.querySelector('.theme-selector');
    this.faviconLink = document.querySelector(`head > link[rel='icon']`);
    this.init();
  }

  init() {
    this.themeToggle.addEventListener('click', () => this.toggleThemeSelector());
    this.themeRadioset.addEventListener('change', e => this.handleChange(e));
    const selectedTheme = localStorage.getItem(THEME_KEY);
    if (selectedTheme) {
      const radioToSelect = document.querySelector(
        `.theme-selector__option[value=${selectedTheme}`
      );
      radioToSelect.checked = true;
      this.changeTheme(selectedTheme);
    }
  }

  toggleThemeSelector() {
    if (this.themeRadioset.dataset.state === 'closed') {
      this.themeRadioset.dataset.state = 'open';
      this.themeToggle.setAttribute('aria-expanded', 'true');
    } else {
      this.themeRadioset.dataset.state = 'closed';
      this.themeToggle.setAttribute('aria-expanded', 'false');
    }
  }

  handleChange(e) {
    this.changeTheme(e.target.value);
  }

  async changeTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem(THEME_KEY, themeName);
    if (!this.faviconSvg) {
      this.faviconSvg = await fetch('/images/logo.svg').then(x => x.text());
    }
    this.faviconLink.setAttribute(`href`, `data:image/svg+xml, ${this.getUpdatedSvg()}`);
  }

  getUpdatedSvg() {
    const container = document.createElement('div');
    container.innerHTML = this.faviconSvg;
    const newSvg = container.firstChild;
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue(
      '--color-theme-highlight'
    );
    newSvg.style = `--fill-color: ${themeColor}`;
    return encodeURIComponent(container.innerHTML);
  }
}

new ThemePicker();
