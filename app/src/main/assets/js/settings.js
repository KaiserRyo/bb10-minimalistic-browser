class BB10BrowserSettings {
  constructor() {
    this._elements = [...document.querySelectorAll('.js-setting')];
    this._conditionalElements = [...document.querySelectorAll('.js-settingConditional')];
    this._initialize();
  }

  static get DEFAULTS() {
    return {
      'bookmarks': [
        {
          title: 'DuckDuckGo',
          url: 'https://duckduckgo.com/'
        }
      ],
      'bookmarks.url': 'file:///android_asset/bookmarks.html',
      'search.engine': 'ddg',
      'navigation.homepage.type': 'bookmarks',
      'navigation.homepage.url': '',
      'navigation.autopaste': false
    };
  }

  _initialize() {
    this.hooks = [];
    this.update();
    this._initializeElements();
  }

  _initializeElements() {
    this._elements.forEach(el => {
      const key = el.dataset.setting;

      this.setElValue(el, this.get(key));
      el.addEventListener('change', () => {
        this.set(key, this.getElValue(el));
        this._updateConditionalSettings();
      });
      el.classList.remove('setting--uninitialized');
    });

    this._updateConditionalSettings();
  }

  _updateConditionalSettings() {
    this._conditionalElements.forEach(el => {
      const expectedValue = el.dataset.settingConditionalValue;
      const actualValue = this.get(el.dataset.settingConditionalKey);

      el.classList[expectedValue === actualValue ? 'remove' : 'add']('setting--hidden');
      el.classList.remove('setting--uninitialized');
    });
  }

  setElValue(el, value) {
    el.type === 'checkbox' ? el.checked = !!value : el.value = value;
  }

  getElValue(el) {
    return el.type === 'checkbox' ? !!el.checked : el.value;
  }

  update() {
    try {
      this._settings = JSON.parse(localStorage.getItem('beolSettings') || '{}');
    } catch(e) {
      this._settings = this._settings || {};
      console.warn('Error retrieving browser settings:', e);
    }

    this.hooks.forEach(hook => hook(this._settings));
  }

  get(key) {
    const path = key.split('.');
    let value = (this._traverse(path, this._settings) || {})._value;

    return typeof value !== 'undefined' ? value : BB10BrowserSettings.DEFAULTS[key];
  }

  set(key, value) {
    let path = key.split('.');
    const end = path.pop();
    let data = this._traverse(path, this._settings, true);
    data[end] = Object.assign({}, data[end], { _value: value });

    localStorage.setItem('beolSettings', JSON.stringify(this._settings));
    this.onSaved(key, value);
    return value;
  }

  onSaved(key, value) {
    this.showMessage(`setting "${key}" changed to ${JSON.stringify(value)}`);
  }

  showMessage(message) {
      const messagesContainer = document.querySelector('.js-messages');

      if (!messagesContainer) {
          return; // alert(message)
      }

      const messageEl = document.createElement('div');
      messageEl.className = 'message';
      messageEl.innerHTML = message;

      document.querySelector('.js-messages').appendChild(messageEl);
      setTimeout(() => messageEl.remove(), 3500);
  }

  _traverse(path, data, create) {
    if (!path.length) {
      return data;
    }

    const segment = path.shift();

    if (!data[segment] && (path.length || create)) {
      data[segment] = {};
    }

    return this._traverse(path, data[segment]);
  }
}


window.browserSettings = new BB10BrowserSettings();
