(() => {
  const CARD_PATHS = {
    passport: '/infobox/cards/passport.md?v=20260514a',
    food: '/infobox/cards/food.md?v=20260514a',
    tree: '/infobox/cards/tree.md?v=20260514a',
  };

  const FALLBACK_CARDS = {
    passport: {
      meta: {
        github: 'https://github.com/m-durana/citizenship-app',
        githubLabel: 'View citizenship-app on GitHub',
      },
      lede: 'Find out which countries you might already qualify for citizenship in. Passport walks through your family heritage and matches it against the jus sanguinis rules of dozens of countries.',
      rows: [
        ['Language', 'TypeScript'],
        ['Frontend', 'React 19, Vite'],
        ['Styling', 'Tailwind CSS 3'],
        ['Tooling', 'ESLint, typescript-eslint'],
      ],
    },
    food: {
      meta: {
        github: 'https://github.com/m-durana/ethevents',
        githubLabel: 'View ethevents on GitHub',
      },
      lede: 'An apéro radar for ETH Zürich. Food Finder scrapes campus event listings and surfaces the ones that mention free food, snacks, or drinks — so a hungry student never misses a buffet.',
      rows: [
        ['Runtime', 'Node.js 18+, ES modules'],
        ['Server', 'Express 5'],
        ['Scraping', 'Cheerio, native fetch'],
        ['API', 'JSON under /api/food'],
        ['Hardening', 'CORS, rate limiting'],
        ['Tests', 'node:test'],
      ],
    },
    tree: {
      meta: {
        github: 'https://github.com/m-durana/tree-visual',
        githubLabel: 'View tree-visual on GitHub',
      },
      lede: 'A step-by-step visualizer for classic tree data structures. Insert, search, and traverse nodes while every operation plays out as a smooth, narrated animation.',
      rows: [
        ['Language', 'TypeScript'],
        ['Frontend', 'React 19, Vite'],
        ['Layout', 'd3-hierarchy'],
        ['Motion', 'Framer Motion'],
        ['State', 'Zustand'],
        ['Styling', 'Tailwind CSS 4'],
      ],
    },
  };

  const cardCache = new Map();

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char]);

  const stripFrontMatter = (source) => {
    if (!source.trimStart().startsWith('---')) return [{}, source];

    const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) return [{}, source];

    const meta = {};
    match[1].split('\n').forEach((line) => {
      const index = line.indexOf(':');
      if (index < 0) return;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      if (key) meta[key] = value;
    });

    return [meta, match[2]];
  };

  const parseTable = (markdown) => markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 2 && !cells.every((cell) => /^-+$/.test(cell)))
    .slice(1)
    .map((cells) => cells.slice(0, 2));

  const parseLede = (markdown) => {
    const lines = markdown.split('\n');
    const paragraphs = [];
    let current = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('|') || line.startsWith('#')) {
        if (current.length) {
          paragraphs.push(current.join(' '));
          current = [];
        }
        continue;
      }
      current.push(line);
    }
    if (current.length) paragraphs.push(current.join(' '));
    return paragraphs[0] || '';
  };

  const parseCard = (markdown) => {
    const [meta, body] = stripFrontMatter(markdown);
    const rows = parseTable(body);
    const lede = parseLede(body);
    return { meta, rows, lede };
  };

  const loadCard = async (key) => {
    if (cardCache.has(key)) return cardCache.get(key);

    const path = CARD_PATHS[key];
    if (!path) return FALLBACK_CARDS[key];

    const promise = fetch(path, { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${path}`);
        return response.text();
      })
      .then(parseCard)
      .then((parsed) => {
        const fallback = FALLBACK_CARDS[key] || {};
        return {
          meta: { ...fallback.meta, ...parsed.meta },
          rows: parsed.rows.length ? parsed.rows : (fallback.rows || []),
          lede: parsed.lede || fallback.lede || '',
        };
      })
      .catch(() => FALLBACK_CARDS[key]);

    cardCache.set(key, promise);
    return promise;
  };

  const renderStack = (rows) => {
    if (!rows.length) return '';
    const items = rows.map(([label, value]) => `
      <dt style="color: #f5f5f5; font-weight: 600;">${escapeHtml(label)}</dt>
      <dd style="margin: 0;">${escapeHtml(value)}</dd>
    `).join('');

    return `
      <span class="infobox-section-label">Built with</span>
      <dl class="infobox-stack">${items}</dl>
    `;
  };

  const renderInfo = (card, title) => {
    const lede = card.lede
      ? `<p class="infobox-lede">${escapeHtml(card.lede)}</p>`
      : '';

    const github = card.meta?.github
      ? `<a class="infobox-action" href="${escapeHtml(card.meta.github)}" target="_blank" rel="noreferrer">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="flex: 0 0 auto;">
            <path d="M8 0C3.58 0 0 3.67 0 8.2c0 3.62 2.29 6.69 5.47 7.78.4.08.55-.18.55-.4v-1.4c-2.23.5-2.7-1.1-2.7-1.1-.36-.95-.89-1.2-.89-1.2-.73-.51.05-.5.05-.5.81.06 1.24.85 1.24.85.72 1.27 1.89.9 2.35.69.07-.54.28-.9.51-1.11-1.78-.21-3.64-.91-3.64-4.05 0-.9.31-1.63.82-2.2-.08-.21-.36-1.05.08-2.18 0 0 .68-.22 2.2.84A7.36 7.36 0 0 1 8 3.94c.68 0 1.36.09 2 .27 1.52-1.06 2.19-.84 2.19-.84.44 1.13.16 1.97.08 2.18.51.57.82 1.3.82 2.2 0 3.15-1.87 3.84-3.65 4.04.29.26.54.76.54 1.53v2.26c0 .22.15.48.55.4A8.12 8.12 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z"/>
          </svg>
          <span>${escapeHtml(card.meta.githubLabel || 'View on GitHub')}</span>
          <span aria-hidden="true">→</span>
        </a>`
      : '';

    return `
      <h1>${escapeHtml(title)}</h1>
      ${lede}
      ${renderStack(card.rows)}
      ${github}
    `;
  };

  const isTyping = () => {
    const active = document.activeElement;
    return active && (
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) ||
      active.isContentEditable
    );
  };

  const getProjectKey = (element) => {
    if (!element) return null;
    if (element.classList.contains('passport')) return 'passport';
    if (element.classList.contains('food')) return 'food';
    if (element.classList.contains('tree')) return 'tree';
    return null;
  };

  const readChipTitle = (element) =>
    element?.querySelector('h2')?.textContent?.trim() || '';

  const init = () => {
    if (!customElements.get('genie-popup')) return;

    const popup = document.createElement('genie-popup');
    popup.disableGlobalHotkey = true;
    document.body.appendChild(popup);

    let hoveredItem = null;
    document.querySelectorAll('.grid .item').forEach((item) => {
      item.addEventListener('mouseenter', () => { hoveredItem = item; });
      item.addEventListener('mouseleave', () => {
        if (hoveredItem === item) hoveredItem = null;
      });
      item.addEventListener('focus', () => { hoveredItem = item; });
      item.addEventListener('blur', () => {
        if (hoveredItem === item) hoveredItem = null;
      });
    });

    document.addEventListener('keydown', async (event) => {
      if (event.key.toLowerCase() !== 'i') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping()) return;

      event.preventDefault();

      if (popup.isOpen) {
        popup.closeOverlay();
        return;
      }

      const activeItem = hoveredItem || document.activeElement?.closest?.('.grid .item');
      const key = getProjectKey(activeItem);

      // No project hovered/focused → nothing meaningful to show.
      if (!key) return;

      const card = await loadCard(key);
      if (!card) return;
      const title = readChipTitle(activeItem) || key;
      popup.show(renderInfo(card, title));
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
