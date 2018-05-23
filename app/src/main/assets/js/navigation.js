class BB10BrowserNavigationActions {
  constructor(navigationReference) {
    this.elements = [...document.querySelectorAll('.js-navigationAction')];
    this.activeEl = null;
    this.isPending = false;
    this.navigationReference = navigationReference;
  }

  attachEvents() {
    this.elements.forEach(el => {
      el.addEventListener('click', () => {
        if (this.isPending) {
          return;
        }

        this.isPending = true;

        if (el.dataset.toggle) {
          this.activeEl = this.activeEl ? null : el;
        } else {
          this.activeEl = null;
        }

        this.renderStatus();
        this.execute(el);
      });
    });

    window.onSystemTabOpen = this.onSystemTabOpen.bind(this);
    window.onSystemTabClose = this.onSystemTabClose.bind(this);
  }

  renderStatus() {
    const activeClassName = 'navigation__action--active';

    this.elements.forEach(el => el.classList.remove(activeClassName));
    if (this.activeEl) {
      this.activeEl.classList.add(activeClassName);
    }
  }

  execute(el) {
    if (!el.dataset.action) {
      return;
    }

    this[el.dataset.action]();
  }

  toggleTabsOverview() {
    if (!this.activeEl) {
      return navigation.closeTabsOverview();
    }

    return navigation.showTabsOverview();
  }

  onSystemTabClose() {
    this.activeEl = null;
    this.isPending = false;
    this.renderStatus();
    this.navigationReference.enableInput();
  }

  onSystemTabOpen() {
    this.isPending = false;
    this.navigationReference.disableInput();
  }
}


class BB10BrowserNavigation {
  constructor(url) {
    this.navigationUrlEl = document.querySelector('.navigation__url');

    this.actions = new BB10BrowserNavigationActions(this);
    this.attachEvents();
    this.openUrl(url);
  }

  openUrl(url) {
    this.loadUrl = null;
    navigation.openUrl(this.determineUrl(url));
  }

  determineUrl(input) {
    const isUrl = input.split('?')[0].indexOf(' ') === -1 && input.split('?')[0].indexOf('.') !== -1;
    const containsProtocol = isUrl && input.indexOf('://') !== -1;

    if (isUrl && containsProtocol) {
      return input;
    }

    if (isUrl) {
      return 'http://' + input;
    }

    const search = encodeURIComponent(input);
    return `https://www.google.com/search?q=${search}&oq=${search}`;
  }

  updateUrl(url) {
    if (url === this.loadUrl) {
      return;
    }

    const navigationUrlEl = document.querySelector('.navigation__url');
    navigationUrlEl.value = url;
  }

  attachEvents() {
    const navigationFormEl = document.querySelector('.js-navigationForm');
    const {navigationUrlEl} = this;

    navigationFormEl.addEventListener('submit', () => {
      this.openUrl(navigationUrlEl.value);
      navigationUrlEl.blur();
    });

    navigationUrlEl.addEventListener('focus', () => {
      navigationUrlEl.setSelectionRange(0, navigationUrlEl.value.length);
    });

    navigationUrlEl.addEventListener('blur', () => {
      setTimeout(() => navigationUrlEl.setSelectionRange(0, 0), 50);
    });

    this.actions.attachEvents();

    window.onNavigationEvent = this.onNavigationEvent.bind(this);
  }

  onNavigationEvent(event) {
    switch(event && event.type) {
      case 'loadstart':
        this.setLoadInProgress(true, event.url, event.navigationUrl);
        break;
      case 'loadstop':
        this.setLoadInProgress(false, event.url, event.navigationUrl);
        break;
      case 'loadprogress':
        this.setLoadProgress(event.progress);
        break;
      case 'status':
        this.setLoadInProgress(false, event.navigationUrl, event.navigationUrl);
        break;
      default:
        console.log('unhandled event:', event);
    }
  }

  setLoadInProgress(isInProgress, url, navigationUrl) {
    if (!url || (this.loadUrl && url !== navigationUrl)) {
        return;
    }

    this.loadInProgress = isInProgress;
    this.updateUrl(url);
    this.loadUrl = url;

    this.renderProgress();
  }

  setLoadProgress(progress) {
    this.loadProgress = parseInt(progress, 10);
    this.renderProgress();
  }

  renderProgress() {
    const navigationIndicatorEl = document.querySelector('.navigation__indicator');

    if (!this.loadInProgress && this.loadProgress === 100) {
      navigationIndicatorEl.style.display = 'none';
      return;
    }

    const navigationProgressEl = document.querySelector('.navigation__progress');
    navigationProgressEl.style.width = this.loadProgress + '%';
    navigationIndicatorEl.style.display = 'block';
  }

  disableInput() {
    this.navigationUrlEl.disabled = true;
  }

  enableInput() {
    this.navigationUrlEl.disabled = false;
  }
}

new BB10BrowserNavigation('https://google.com');