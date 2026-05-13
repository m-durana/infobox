class GeniePopup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
    this.isBusy = false;
    this.isOpen = false;
    this.currentRaf = null;
    this.closeSnapshotCache = null;
    this.closeSnapshotTimer = null;
    this.closeSnapshotInFlight = false;
    this.CLOSE_CACHE_MAX_AGE = 2000;
    this.DUR = 300;
    this.ORIGIN_MODE = 'cursor';
    this.disableGlobalHotkey = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.setupCanvasAnimation();
  }

  render() {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          --genie-duration: 300ms;
          --miro-bg: #0e0e10;
          --miro-panel: #0e0e10;
          --miro-text: #f5f5f5;
          --miro-muted: #b6bbc1;
          --miro-faint: #8a8f96;
          --miro-line: rgba(255, 255, 255, 0.12);
          --miro-line-strong: rgba(255, 255, 255, 0.22);
          --miro-accent-a: #d97757;
          --miro-accent-b: #9bc28d;
          font-family: "Nunito Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        canvas {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 10000;
          display: none;
        }

        .overlay {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(14, 14, 16, 0.78);
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--miro-text);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 180ms ease, visibility 180ms ease;
        }

        .overlay.is-active {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .overlay.is-preparing {
          opacity: 0;
          visibility: visible;
          pointer-events: none;
          transition: none;
        }

        .content {
          background: var(--miro-panel);
          width: min(760px, calc(100vw - 2rem));
          max-height: min(760px, calc(100vh - 2rem));
          padding: clamp(1.4rem, 4vw, 2.6rem);
          border-radius: 0;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          position: relative;
          box-shadow:
            0 32px 90px rgba(0, 0, 0, 0.58),
            0 0 0 1px var(--miro-line);
          opacity: 0;
        }

        .content::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .overlay.is-open .content,
        .overlay.is-preparing .content {
          opacity: 1;
        }

        .overlay.is-animating .content {
          opacity: 0;
          pointer-events: none;
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 0;
          font-size: 1rem;
          cursor: pointer;
          color: var(--miro-faint);
          transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
          user-select: none;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--miro-line);
          padding: 0;
          line-height: 1;
        }

        .close-btn:hover {
          color: var(--miro-text);
          border-color: var(--miro-line-strong);
          background: rgba(255, 255, 255, 0.08);
        }

        ::slotted(h1) {
          max-width: calc(100% - 3rem);
          color: var(--miro-text);
          font-size: clamp(2rem, 7vw, 4.4rem);
          line-height: 0.92;
          letter-spacing: -0.035em;
          margin-top: 0;
          margin-bottom: 1rem;
        }

        ::slotted(hr) {
          border: 0;
          height: 1px;
          background: var(--miro-line);
          margin: 1.4rem 0;
        }

        ::slotted(code) {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.15rem 0.4rem;
          border-radius: 0;
        }

        ::slotted(li) {
          margin: 0.5rem 0;
        }

        ::slotted(.infobox-lede) {
          margin: 0;
          color: var(--miro-muted);
          font-size: clamp(1rem, 2.5vw, 1.16rem);
          line-height: 1.65;
        }

        ::slotted(.infobox-section-title) {
          margin: 1.35rem 0 0.65rem;
          color: var(--miro-text);
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.01em;
        }

        ::slotted(.infobox-list) {
          margin: 0;
          padding-left: 1.1rem;
          color: var(--miro-muted);
          line-height: 1.55;
        }

        ::slotted(.infobox-action) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 1.35rem;
          margin-right: 1.5rem;
          border-bottom: 1px solid transparent;
          color: #9aa0a6;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.4;
          text-decoration: none;
          transition: color 0.2s ease, border-color 0.2s ease;
        }

        ::slotted(.infobox-action:hover) {
          border-bottom-color: var(--miro-text);
          color: var(--miro-text);
        }

        @media (max-width: 520px) {
          .content {
            width: calc(100vw - 1rem);
            max-height: calc(100vh - 1rem);
            border-radius: 0;
          }
        }
      </style>

      <canvas id="genie-canvas"></canvas>

      <div class="overlay" id="overlay">
        <div class="content" id="content-box">
          <button class="close-btn" id="close-btn" aria-label="Close infobox">&times;</button>
          <slot></slot>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  setupEventListeners() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    const closeBtn = this.shadowRoot.getElementById('close-btn');
    const overlay = this.shadowRoot.getElementById('overlay');

    closeBtn.addEventListener('click', () => this.closeOverlay());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeOverlay();
    });

    document.addEventListener('keydown', (e) => {
      const activeElement = document.activeElement;
      const isTyping =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName) ||
        activeElement.isContentEditable;

      if (isTyping) return;

      if (!this.disableGlobalHotkey && e.key.toLowerCase() === 'i') {
        this.toggleOverlay();
      }

      if (e.key === 'Escape' && this.isOpen) {
        this.closeOverlay();
      }
    });

    window.addEventListener('resize', () => {
      this.clearCanvas();
      if (this.isOpen) {
        this.shadowRoot.getElementById('overlay').classList.add('is-open');
      }
    });
  }

  setupCanvasAnimation() {
    this.canvas = this.shadowRoot.getElementById('genie-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.contentBox = this.shadowRoot.getElementById('content-box');
    this.overlay = this.shadowRoot.getElementById('overlay');

    this.contentBox.addEventListener('scroll', () => {
      if (!this.isOpen || this.isBusy) return;
      this.scheduleCloseSnapshotRefresh(90);
    }, { passive: true });
  }

  clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  eioC(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  eIn2(t) {
    return t * t;
  }

  eOut2(t) {
    return 1 - (1 - t) * (1 - t);
  }

  eOut3(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  async nextFrame() {
    return new Promise((r) => requestAnimationFrame(r));
  }

  setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * dpr);
    this.canvas.height = Math.round(window.innerHeight * dpr);
    this.canvas.style.display = 'block';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  clearCanvas() {
    if (this.currentRaf) {
      cancelAnimationFrame(this.currentRaf);
      this.currentRaf = null;
    }
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.canvas.style.display = 'none';
  }

  async snapshotWindow() {
    const rect = this.contentBox.getBoundingClientRect();
    return await html2canvas(this.contentBox, {
      backgroundColor: null,
      scale: 1,
      useCORS: true,
      allowTaint: false,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      scrollX: 0,
      scrollY: 0,
    });
  }

  cloneCanvas(sourceCanvas) {
    const copy = document.createElement('canvas');
    copy.width = sourceCanvas.width;
    copy.height = sourceCanvas.height;
    const copyCtx = copy.getContext('2d');
    if (copyCtx) copyCtx.drawImage(sourceCanvas, 0, 0);
    return copy;
  }

  getCloseSnapshotFromCache() {
    const cache = this.closeSnapshotCache;
    if (!cache) return null;

    const cacheAge = Date.now() - cache.createdAt;
    const currentScroll = Math.round(this.contentBox.scrollTop);
    const cacheScroll = Math.round(cache.scrollTop);
    const sameSize =
      cache.width === Math.round(this.contentBox.clientWidth) &&
      cache.height === Math.round(this.contentBox.clientHeight);

    if (cacheAge > this.CLOSE_CACHE_MAX_AGE) return null;
    if (Math.abs(currentScroll - cacheScroll) > 1) return null;
    if (!sameSize) return null;

    return cache.canvas;
  }

  async refreshCloseSnapshotCache() {
    if (!this.isOpen || this.isBusy || this.closeSnapshotInFlight) return;

    this.closeSnapshotInFlight = true;
    try {
      const sourceCanvas = await this.snapshotWindow();
      this.closeSnapshotCache = {
        canvas: this.cloneCanvas(sourceCanvas),
        scrollTop: this.contentBox.scrollTop,
        width: Math.round(this.contentBox.clientWidth),
        height: Math.round(this.contentBox.clientHeight),
        createdAt: Date.now(),
      };
    } finally {
      this.closeSnapshotInFlight = false;
    }
  }

  scheduleCloseSnapshotRefresh(delay = 0) {
    if (this.closeSnapshotTimer) {
      clearTimeout(this.closeSnapshotTimer);
      this.closeSnapshotTimer = null;
    }

    this.closeSnapshotTimer = setTimeout(() => {
      this.closeSnapshotTimer = null;
      this.refreshCloseSnapshotCache();
    }, delay);
  }

  getOriginPoint(finalRect, cursorX, cursorY) {
    if (this.ORIGIN_MODE === 'cursor') {
      return {
        x: this.clamp(cursorX, 0, window.innerWidth),
        y: this.clamp(cursorY, 0, window.innerHeight),
      };
    } else if (this.ORIGIN_MODE === 'top') {
      return {
        x: finalRect.left + finalRect.width / 2,
        y: finalRect.top,
      };
    } else {
      return {
        x: finalRect.left + finalRect.width / 2,
        y: finalRect.top + finalRect.height / 2,
      };
    }
  }

  renderGenie(sourceCanvas, rawT, direction, origin, finalRect) {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const sourceW = sourceCanvas.width;
    const sourceH = sourceCanvas.height;

    const originR = this.clamp((origin.y - finalRect.top) / finalRect.height, 0, 1);

    for (let y = 0; y < sourceH - 1; y++) {
      const r = y / sourceH;

      const distanceFromOrigin = Math.abs(r - originR);
      const rawDelay = this.clamp(distanceFromOrigin * 0.48, 0, 0.48);
      const delay = this.eOut3(rawDelay / 0.48) * 0.48; // Ease the delay curve for smooth rounding
      const localT = this.clamp((rawT - delay) / (1 - delay), 0, 1);

      const xE = this.eioC(localT);
      const yE = this.eIn2(localT);

      let left, right, destY;

      if (direction === 'minimize') {
        left = this.lerp(finalRect.left, origin.x, xE);
        right = this.lerp(finalRect.right, origin.x, xE);
        destY = this.lerp(finalRect.top + y, origin.y, yE);
      } else {
        left = this.lerp(origin.x, finalRect.left, xE);
        right = this.lerp(origin.x, finalRect.right, xE);
        destY = this.lerp(origin.y, finalRect.top + r * finalRect.height, yE);
      }

      const rowW = right - left;
      if (rowW < 0.8) continue;

      this.ctx.drawImage(sourceCanvas, 0, y, sourceW, 2, left, destY, rowW, 2);
    }
  }

  animateGenie(sourceCanvas, direction, origin, finalRect) {
    return new Promise((resolve) => {
      let start = null;

      const frame = (timestamp) => {
        if (!start) start = timestamp;

        const rawT = this.clamp((timestamp - start) / this.DUR, 0, 1);
        this.renderGenie(sourceCanvas, rawT, direction, origin, finalRect);

        if (rawT < 1) {
          this.currentRaf = requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };

      this.currentRaf = requestAnimationFrame(frame);
    });
  }

  async openOverlay() {
    if (this.isBusy || this.isOpen) return;

    this.isBusy = true;
    this.contentBox.scrollTop = 0;

    this.overlay.classList.add('is-preparing');
    this.overlay.classList.remove('is-active', 'is-open', 'is-animating');

    await this.nextFrame();

    const finalRect = this.contentBox.getBoundingClientRect();
    const origin = this.getOriginPoint(finalRect, this.mouseX, this.mouseY);

    const sourceCanvas = await this.snapshotWindow();

    this.overlay.classList.remove('is-preparing');
    this.overlay.classList.add('is-active', 'is-animating');

    this.setupCanvas();

    await this.animateGenie(sourceCanvas, 'open', origin, finalRect);

    this.clearCanvas();

    this.overlay.classList.remove('is-animating');
    this.overlay.classList.add('is-open');

    this.isOpen = true;
    this.isBusy = false;

    this.scheduleCloseSnapshotRefresh();
  }

  async closeOverlay() {
    if (this.isBusy || !this.isOpen) return;

    this.isBusy = true;

    const finalRect = this.contentBox.getBoundingClientRect();
    const origin = this.getOriginPoint(finalRect, this.mouseX, this.mouseY);

    const sourceCanvas = this.getCloseSnapshotFromCache() || await this.snapshotWindow();

    this.overlay.classList.remove('is-open');
    this.overlay.classList.add('is-animating');

    this.setupCanvas();

    await this.animateGenie(sourceCanvas, 'minimize', origin, finalRect);

    this.clearCanvas();

    this.overlay.classList.remove('is-active', 'is-animating');

    this.isOpen = false;
    this.isBusy = false;
    this.closeSnapshotCache = null;

  }

  toggleOverlay() {
    if (this.isOpen) {
      this.closeOverlay();
    } else {
      this.openOverlay();
    }
  }

  setContent(html) {
    this.innerHTML = html;
  }

  setOriginFromElement(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    this.mouseX = rect.left + rect.width / 2;
    this.mouseY = rect.top + rect.height / 2;
  }

  show(html, originElement = null) {
    if (html) this.setContent(html);
    this.setOriginFromElement(originElement);
    this.openOverlay();
  }
}

customElements.define('genie-popup', GeniePopup);
