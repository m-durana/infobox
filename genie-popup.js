class GeniePopup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isBusy = false;
    this.isOpen = false;
    this.disableGlobalHotkey = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          --miro-bg: #0e0e10;
          --miro-panel: #141417;
          --miro-text: #f5f5f5;
          --miro-muted: #b6bbc1;
          --miro-faint: #8a8f96;
          --miro-line: rgba(255, 255, 255, 0.10);
          --miro-line-strong: rgba(255, 255, 255, 0.22);
          --miro-accent: #d97757;
          font-family: "Nunito Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .overlay {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(8, 8, 10, 0.72);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--miro-text);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 140ms ease, visibility 140ms ease;
        }

        .overlay.is-open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .content {
          background: var(--miro-panel);
          width: min(640px, calc(100vw - 2rem));
          max-height: calc(100vh - 2rem);
          padding: clamp(1.5rem, 3.5vw, 2.4rem) clamp(1.5rem, 3.5vw, 2.6rem);
          border-radius: 14px;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          position: relative;
          box-shadow:
            0 24px 64px rgba(0, 0, 0, 0.55),
            0 0 0 1px var(--miro-line);
          transform: scale(0.94) translateY(8px);
          opacity: 0;
          transition: transform 160ms cubic-bezier(0.2, 0.7, 0.2, 1),
                      opacity 140ms ease;
        }

        .overlay.is-open .content {
          transform: scale(1) translateY(0);
          opacity: 1;
        }

        .content::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .close-btn {
          position: absolute;
          top: 0.9rem;
          right: 0.9rem;
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          font-size: 1.05rem;
          cursor: pointer;
          color: var(--miro-faint);
          transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
          user-select: none;
          background: transparent;
          border: 1px solid var(--miro-line);
          padding: 0;
          line-height: 1;
        }

        .close-btn:hover {
          color: var(--miro-text);
          border-color: var(--miro-line-strong);
          background: rgba(255, 255, 255, 0.06);
        }

        ::slotted(h1) {
          max-width: calc(100% - 3rem);
          color: var(--miro-text);
          font-size: clamp(1.85rem, 4.8vw, 2.6rem);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.01em;
          margin: 0 0 0.75rem;
        }

        ::slotted(.infobox-lede) {
          margin: 0 0 1.4rem;
          color: var(--miro-muted);
          font-size: 1.02rem;
          line-height: 1.55;
        }

        ::slotted(.infobox-section-label) {
          display: block;
          margin: 1.25rem 0 0.5rem;
          color: var(--miro-faint);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        ::slotted(.infobox-stack) {
          width: 100%;
          margin: 0;
          padding: 0;
          list-style: none;
          color: var(--miro-muted);
          font-size: 0.96rem;
          line-height: 1.5;
          display: grid;
          grid-template-columns: max-content 1fr;
          column-gap: 1.4rem;
          row-gap: 0.55rem;
        }

        ::slotted(.infobox-action) {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          margin-top: 1.6rem;
          color: var(--miro-text);
          font-size: 0.96rem;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid var(--miro-line);
          padding-bottom: 2px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        ::slotted(.infobox-action:hover) {
          color: var(--miro-accent);
          border-bottom-color: var(--miro-accent);
        }

        @media (max-width: 520px) {
          .content {
            width: calc(100vw - 1rem);
            max-height: calc(100vh - 1rem);
            padding: 1.4rem 1.3rem;
          }
        }
      </style>

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
    const closeBtn = this.shadowRoot.getElementById('close-btn');
    const overlay = this.shadowRoot.getElementById('overlay');
    this.overlay = overlay;
    this.contentBox = this.shadowRoot.getElementById('content-box');

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
  }

  openOverlay() {
    if (this.isOpen) return;
    if (this.contentBox) this.contentBox.scrollTop = 0;
    this.overlay.classList.add('is-open');
    this.isOpen = true;
  }

  closeOverlay() {
    if (!this.isOpen) return;
    this.overlay.classList.remove('is-open');
    this.isOpen = false;
  }

  toggleOverlay() {
    if (this.isOpen) this.closeOverlay();
    else this.openOverlay();
  }

  setContent(html) {
    this.innerHTML = html;
  }

  show(html, _originElement = null) {
    if (html) this.setContent(html);
    this.openOverlay();
  }
}

customElements.define('genie-popup', GeniePopup);
