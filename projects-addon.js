(() => {
  const CARD_PATHS = {
    overview: '/infobox/cards/overview.md?v=20260513b',
    passport: '/infobox/cards/passport.md?v=20260513b',
    food: '/infobox/cards/food.md?v=20260513b',
    tree: '/infobox/cards/tree.md?v=20260513b',
  };

  const FALLBACK_CARDS = {
    overview: {
      meta: {},
      rows: [
        ['Projects page', 'Vite, WebGL canvas, custom metaball shader effect'],
        ['Passport', 'TypeScript, React, Vite, Tailwind CSS'],
        ['Food Finder', 'Node.js, Express, Cheerio, native fetch'],
        ['Branches', 'TypeScript, React, Vite, d3-hierarchy, Framer Motion, Zustand'],
      ],
    },
    passport: {
      meta: {
        github: 'https://github.com/m-durana/citizenship-app',
        githubLabel: 'GitHub repository: citizenship-app',
      },
      rows: [
        ['Language', 'TypeScript'],
        ['Frontend', 'React 19, Vite'],
        ['Styling', 'Tailwind CSS 3, PostCSS'],
        ['Tooling', 'ESLint, typescript-eslint'],
      ],
    },
    food: {
      meta: {
        github: 'https://github.com/m-durana/ethevents',
        githubLabel: 'GitHub repository: ethevents',
      },
      rows: [
        ['Runtime', 'Node.js 18+, ES modules'],
        ['Server', 'Express 5'],
        ['Scraping/parsing', 'Cheerio, native fetch'],
        ['API', 'JSON endpoints under /api/food'],
        ['Browser route', 'Static /food client'],
        ['Safety', 'CORS, express-rate-limit'],
        ['Tests', 'node:test'],
      ],
    },
    tree: {
      meta: {
        github: 'https://github.com/m-durana/tree-visual',
        githubLabel: 'GitHub repository: tree-visual',
      },
      rows: [
        ['Language', 'TypeScript'],
        ['Frontend', 'React 19, Vite'],
        ['Visualization', 'd3-hierarchy'],
        ['Motion/state', 'Framer Motion, Zustand'],
        ['Styling', 'Tailwind CSS 4, PostCSS'],
        ['Tests', 'Vitest'],
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

  const parseCard = (markdown) => {
    const [meta, body] = stripFrontMatter(markdown);
    const rows = parseTable(body);
    return { meta, rows };
  };

  const loadCard = async (key) => {
    const cardKey = key || 'overview';
    if (cardCache.has(cardKey)) return cardCache.get(cardKey);

    const path = CARD_PATHS[cardKey];
    if (!path) return FALLBACK_CARDS[cardKey] || FALLBACK_CARDS.overview;

    const promise = fetch(path, { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${path}`);
        return response.text();
      })
      .then(parseCard)
      .catch(() => FALLBACK_CARDS[cardKey] || FALLBACK_CARDS.overview);

    cardCache.set(cardKey, promise);
    return promise;
  };

  const readChipInfo = (element) => ({
    title: element?.querySelector('h2')?.textContent?.trim() || 'Miro Projects',
    summary: element?.querySelector('p')?.textContent?.trim() || 'Small collection of web projects published on miro.build.',
  });

  const renderStackTable = (rows) => {
    if (!rows.length) return '';

    return `
      <table class="infobox-stack" style="width: 100%; margin: 1.35rem 0 0; border-collapse: collapse; color: #b6bbc1; font-size: 0.98rem; line-height: 1.45;">
        <tbody>
          ${rows.map(([label, value]) => `
            <tr style="border-top: 1px solid rgba(255, 255, 255, 0.12);">
              <th scope="row" style="width: 34%; padding: 0.72rem 1.2rem 0.72rem 0; color: #f5f5f5; font-weight: 700; text-align: left; vertical-align: top;">${escapeHtml(label)}</th>
              <td style="padding: 0.72rem 0; text-align: left; vertical-align: top;">${escapeHtml(value)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const renderInfo = (card, chipInfo) => {
    const github = card.meta.github
      ? `<a class="infobox-action infobox-github" href="${escapeHtml(card.meta.github)}" target="_blank" rel="noreferrer" aria-label="View ${escapeHtml(chipInfo.title)} on GitHub">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 16 16" fill="currentColor" style="flex: 0 0 auto;">
            <path d="M8 0C3.58 0 0 3.67 0 8.2c0 3.62 2.29 6.69 5.47 7.78.4.08.55-.18.55-.4v-1.4c-2.23.5-2.7-1.1-2.7-1.1-.36-.95-.89-1.2-.89-1.2-.73-.51.05-.5.05-.5.81.06 1.24.85 1.24.85.72 1.27 1.89.9 2.35.69.07-.54.28-.9.51-1.11-1.78-.21-3.64-.91-3.64-4.05 0-.9.31-1.63.82-2.2-.08-.21-.36-1.05.08-2.18 0 0 .68-.22 2.2.84A7.36 7.36 0 0 1 8 3.94c.68 0 1.36.09 2 .27 1.52-1.06 2.19-.84 2.19-.84.44 1.13.16 1.97.08 2.18.51.57.82 1.3.82 2.2 0 3.15-1.87 3.84-3.65 4.04.29.26.54.76.54 1.53v2.26c0 .22.15.48.55.4A8.12 8.12 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z"/>
          </svg>
          <span>${escapeHtml(card.meta.githubLabel || 'View on GitHub')}</span>
          <span aria-hidden="true">-&gt;</span>
        </a>`
      : '';

    return `
      <style>
        @media (max-width: 560px) {
          .infobox-stack th,
          .infobox-stack td {
            display: block !important;
            width: 100% !important;
            padding-right: 0 !important;
          }

          .infobox-stack th {
            padding-bottom: 0.18rem !important;
          }

          .infobox-stack td {
            padding-top: 0 !important;
          }
        }
      </style>
      <h1>${escapeHtml(chipInfo.title)}</h1>
      <p class="infobox-lede">${escapeHtml(chipInfo.summary)}</p>
      ${renderStackTable(card.rows)}
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

  const init = () => {
    if (!customElements.get('genie-popup')) return;

    const popup = document.createElement('genie-popup');
    popup.disableGlobalHotkey = true;
    document.body.appendChild(popup);

    let hoveredItem = null;
    document.querySelectorAll('.grid .item').forEach((item) => {
      item.addEventListener('mouseenter', () => {
        hoveredItem = item;
      });
      item.addEventListener('mouseleave', () => {
        if (hoveredItem === item) hoveredItem = null;
      });
      item.addEventListener('focus', () => {
        hoveredItem = item;
      });
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
      const card = await loadCard(key || 'overview');
      const chipInfo = readChipInfo(activeItem);
      popup.show(renderInfo(card, chipInfo), activeItem);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
