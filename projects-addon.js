(function () {
  const PROJECTS = {
    passport: {
      title: 'Passport',
      href: '/projects/passport/',
      github: 'https://github.com/m-durana/citizenship-app',
      summary: 'Citizenship eligibility checker based on family heritage inputs.',
      details: [
        'Language: TypeScript',
        'Frontend: React 19, Vite',
        'Styling: Tailwind CSS 3, PostCSS',
        'Tooling: ESLint, typescript-eslint',
      ],
    },
    food: {
      title: 'Food Finder',
      href: '/food/',
      github: 'https://github.com/m-durana/ethevents',
      summary: 'ETH apéro/event searcher for finding free food on campus.',
      details: [
        'Stack: not available in this checkout',
        'Source: event listing scanner/search page',
        'Route: /food/',
      ],
    },
    tree: {
      title: 'Branches',
      href: '/projects/branches/',
      github: 'https://github.com/m-durana/tree-visual',
      summary: 'Step-by-step visualizer for classic tree data structures.',
      details: [
        'Language: TypeScript',
        'Frontend: React 19, Vite',
        'Libraries: d3-hierarchy, Framer Motion, Zustand',
        'Styling: Tailwind CSS 4, PostCSS',
        'Tests: Vitest',
      ],
    },
  };

  const OVERVIEW = {
    title: 'Miro Projects',
    summary: 'Small collection of web projects published on miro.build.',
    details: [
      'Projects page: Vite, WebGL canvas, custom metaball shader effect',
      'Passport: TypeScript, React, Vite, Tailwind CSS',
      'Branches: TypeScript, React, Vite, d3-hierarchy, Framer Motion, Zustand, Vitest',
      'Food Finder: event search route at /food/',
    ],
  };

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char]);

  const renderInfo = (project) => {
    const github = project.github
      ? `<a class="infobox-action" href="${escapeHtml(project.github)}" target="_blank" rel="noreferrer">View this project on GitHub</a>`
      : '';
    const live = project.href
      ? `<a class="infobox-action" href="${escapeHtml(project.href)}">Open project</a>`
      : '';

    return `
      <h1>${escapeHtml(project.title)}</h1>
      <p class="infobox-lede">${escapeHtml(project.summary)}</p>
      <p class="infobox-section-title">Technical details</p>
      <ul class="infobox-list">
        ${project.details.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
      ${github}
      ${live}
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

    document.addEventListener('keydown', (event) => {
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
      popup.show(renderInfo(key ? PROJECTS[key] : OVERVIEW), activeItem);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
