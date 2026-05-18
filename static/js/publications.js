// publications.js — renders SNAPlab publications from publications.json
// with tag-based filtering and shareable URL hashes.

(function () {
  'use strict';

  // Tag definitions: id -> short display label. Order = display order in filter bar.
  const TAGS = [
    { id: 'peripheral-coding',       label: 'Peripheral & subcortical coding' },
    { id: 'snhl',                    label: 'SNHL' },
    { id: 'temporal-binaural',       label: 'Temporal & binaural processing' },
    { id: 'attention-cortex',        label: 'Attention & cortex' },
    { id: 'asd',                     label: 'ASD' },
    { id: 'translational-audiology', label: 'Translational audiology' },
    { id: 'individual-differences',  label: 'Individual differences' },
    { id: 'computational-modeling',  label: 'Computational modeling' },
    { id: 'ai-ml',                   label: 'AI / Machine learning' },
    { id: 'methods-tools',           label: 'Methods & tools' },
    { id: 'reviews-perspectives',    label: 'Reviews & perspectives' }
  ];
  const TAG_LABEL = Object.fromEntries(TAGS.map(t => [t.id, t.label]));

  // ----- DOM helpers ---------------------------------------------------------
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.startsWith('on') && typeof attrs[k] === 'function') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== undefined && attrs[k] !== null) node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  // ----- Paper rendering -----------------------------------------------------
  function renderPaperBody(p) {
    const body = el('div', { class: 'accordion-body' });

    const muted = el('span', { class: 'text-muted' });
    muted.textContent = p.authors + ' (' + p.year + ').' + (p.note ? ' [' + p.note + ']' : '');
    body.appendChild(muted);
    body.appendChild(document.createTextNode(' '));

    const strong = el('strong');
    strong.textContent = ' ' + p.title + ' ';
    body.appendChild(strong);

    const em = el('em');
    em.textContent = ' ' + p.venue + ' ';
    body.appendChild(em);

    const L = p.links || {};
    if (L.pdf) {
      const a = el('a', { class: 'btn btn-outline-danger btn-sm ml-2 mb-2', href: L.pdf, target: '_blank' });
      a.innerHTML = '<i class="fas fa-file-pdf"></i> PDF';
      body.appendChild(document.createTextNode(' '));
      body.appendChild(a);
    }
    if (L.pubmed) {
      body.appendChild(document.createTextNode(' '));
      body.appendChild(el('a', { class: 'btn btn-outline-secondary btn-sm mr-2 mb-2', href: L.pubmed, target: '_blank' }, 'PubMed'));
    }
    if (L.www) {
      body.appendChild(document.createTextNode(' '));
      body.appendChild(el('a', { class: 'btn btn-outline-primary btn-sm mr-2 mb-2', href: L.www, target: '_blank' }, 'www'));
    }
    if (p.preprint) {
      body.appendChild(document.createTextNode(' '));
      body.appendChild(el('span', { class: 'badge rounded-pill text-bg-warning' }, 'PREPRINT'));
    }
    if (p.bookChapter) {
      body.appendChild(document.createTextNode(' '));
      body.appendChild(el('span', { class: 'badge rounded-pill text-bg-success' }, 'BOOK CHAPTER'));
    }

    // Tag pills (subtle, after the paper)
    if (p.tags && p.tags.length) {
      const tagRow = el('div', { class: 'pub-tags mt-1' });
      p.tags.forEach(t => {
        const label = TAG_LABEL[t] || t;
        tagRow.appendChild(el('span', { class: 'pub-tag', 'data-tag': t }, label));
      });
      body.appendChild(tagRow);
    }

    return body;
  }

  // ----- Year-accordion view (no filter) -------------------------------------
  function renderByYear(pubs, container) {
    container.innerHTML = '';
    const accordion = el('div', { class: 'accordion mt-4', id: 'pubsAccordion' });

    // Group by year, descending
    const byYear = {};
    pubs.forEach(p => { (byYear[p.year] = byYear[p.year] || []).push(p); });
    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

    years.forEach((year, idx) => {
      const isOpen = idx === 0; // top year open by default
      const item = el('div', { class: 'accordion-item' });

      const header = el('h2', { class: 'accordion-header', id: 'heading' + year });
      const button = el('button', {
        class: 'accordion-button' + (isOpen ? '' : ' collapsed'),
        type: 'button',
        'data-bs-toggle': 'collapse',
        'data-bs-target': '#collapse' + year,
        'aria-expanded': isOpen ? 'true' : 'false',
        'aria-controls': 'collapse' + year
      });
      button.appendChild(el('h4', null, String(year)));
      header.appendChild(button);
      item.appendChild(header);

      const collapse = el('div', {
        id: 'collapse' + year,
        class: 'accordion-collapse collapse' + (isOpen ? ' show' : ''),
        'aria-labelledby': 'heading' + year,
        'data-bs-parent': '#pubsAccordion'
      });
      const inner = el('div', { class: 'accordion-body' });
      byYear[year].forEach(p => inner.appendChild(renderPaperBody(p)));
      collapse.appendChild(inner);
      item.appendChild(collapse);

      accordion.appendChild(item);
    });

    container.appendChild(accordion);
  }

  // ----- Flat-list view (filter active) --------------------------------------
  function renderFlat(pubs, container, activeTag) {
    container.innerHTML = '';

    const matches = pubs.filter(p => p.tags && p.tags.indexOf(activeTag) !== -1);
    matches.sort((a, b) => b.year - a.year); // newest first

    const wrap = el('div', { class: 'mt-4' });
    const heading = el('p', { class: 'text-muted small mb-3' });
    heading.textContent = matches.length + ' publication' + (matches.length === 1 ? '' : 's') +
      ' tagged "' + (TAG_LABEL[activeTag] || activeTag) + '"';
    wrap.appendChild(heading);

    if (matches.length === 0) {
      wrap.appendChild(el('p', { class: 'text-muted' }, 'No publications match this tag yet.'));
    } else {
      matches.forEach(p => {
        const card = el('div', { class: 'pub-flat-card' });
        const yearTag = el('div', { class: 'pub-flat-year text-muted small' }, String(p.year));
        card.appendChild(yearTag);
        card.appendChild(renderPaperBody(p));
        wrap.appendChild(card);
      });
    }
    container.appendChild(wrap);
  }

  // ----- Filter bar ----------------------------------------------------------
  function renderFilterBar(state, onChange) {
    const bar = document.getElementById('pubsFilterBar');
    bar.innerHTML = '';

    // "All / By year" button
    const allBtn = el('button', {
      type: 'button',
      class: 'pub-filter-btn' + (!state.activeTag ? ' active' : ''),
      'aria-pressed': !state.activeTag ? 'true' : 'false',
      onclick: () => onChange(null)
    }, 'All (by year)');
    bar.appendChild(allBtn);

    TAGS.forEach(tag => {
      const isActive = state.activeTag === tag.id;
      const btn = el('button', {
        type: 'button',
        class: 'pub-filter-btn' + (isActive ? ' active' : ''),
        'aria-pressed': isActive ? 'true' : 'false',
        'data-tag': tag.id,
        onclick: () => onChange(isActive ? null : tag.id)
      }, tag.label);
      bar.appendChild(btn);
    });
  }

  // ----- URL hash sync -------------------------------------------------------
  function readTagFromHash() {
    const m = (window.location.hash || '').match(/tag=([a-z0-9-]+)/i);
    if (!m) return null;
    const candidate = m[1].toLowerCase();
    return TAGS.some(t => t.id === candidate) ? candidate : null;
  }

  function writeTagToHash(tag) {
    const newHash = tag ? '#tag=' + tag : '';
    if (newHash !== window.location.hash) {
      // Use replaceState to avoid bloating browser history with every click
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
      } catch (e) {
        window.location.hash = newHash;
      }
    }
  }

  // ----- Main ----------------------------------------------------------------
  function init(pubs) {
    const container = document.getElementById('pubsContainer');
    const live = document.getElementById('pubsLive');
    const state = { activeTag: readTagFromHash() };

    function render() {
      renderFilterBar(state, applyTag);
      if (state.activeTag) {
        renderFlat(pubs, container, state.activeTag);
        const count = pubs.filter(p => p.tags && p.tags.indexOf(state.activeTag) !== -1).length;
        if (live) live.textContent = 'Showing ' + count + ' publications tagged ' + (TAG_LABEL[state.activeTag] || state.activeTag);
      } else {
        renderByYear(pubs, container);
        if (live) live.textContent = 'Showing all ' + pubs.length + ' publications by year';
      }
    }

    function applyTag(tagId) {
      state.activeTag = tagId;
      writeTagToHash(tagId);
      render();
      // Scroll filter bar back into view for context after filtering
      const bar = document.getElementById('pubsFilterBar');
      if (bar) bar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Click any tag pill on a paper to apply that tag as a filter
    document.addEventListener('click', function (e) {
      const t = e.target.closest('.pub-tag');
      if (t && t.dataset.tag) {
        e.preventDefault();
        applyTag(t.dataset.tag);
      }
    });

    // React to back/forward navigation between filter states
    window.addEventListener('hashchange', function () {
      const tag = readTagFromHash();
      if (tag !== state.activeTag) {
        state.activeTag = tag;
        render();
      }
    });

    render();
  }

  function renderMetrics(m) {
    const slot = document.getElementById('pubsMetrics');
    if (!slot || !m) return;
    // Format citations with thousand separator (e.g. 3,191)
    const fmtCitations = (m.citations != null) ? m.citations.toLocaleString() : '—';
    slot.innerHTML =
      'As of <code>' + m.asOf + '</code>, our work has been cited <code>' + fmtCitations +
      '</code> times, with an h-index of <code>' + m.hIndex +
      '</code>, and an i-10 index of <code>' + m.i10Index + '</code> according to ' +
      '<span class="google-scholar-link">' +
      '<img alt="Google Scholar Favicon" src="https://www.google.com/s2/favicons?domain=scholar.google.com"/>' +
      '<a href="https://scholar.google.com" target="_blank">Google Scholar</a></span>. ' +
      'According to the <a href="https://icite.od.nih.gov/">iCite bibliometric tool</a> from the ' +
      'National Institutes of Health (NIH), our work has a ' +
      '<a href="https://doi.org/10.1371/journal.pbio.1002541">Relative Citation Ratio (RCR)</a> of ' +
      '<code>' + m.rcr + '</code>. RCR measures the scientific influence of each paper by field- ' +
      'and time-adjusting the citations it has received, and benchmarking to the median for NIH ' +
      'publications, the value of which is set at 1.0.';
  }

  // Fetch data and start
  fetch('publications.json', { cache: 'no-cache' })
    .then(r => {
      if (!r.ok) throw new Error('Failed to load publications.json (' + r.status + ')');
      return r.json();
    })
    .then(data => {
      // Support both shapes: legacy bare array, or { metrics, publications }
      const pubs = Array.isArray(data) ? data : data.publications;
      const metrics = Array.isArray(data) ? null : data.metrics;
      renderMetrics(metrics);
      init(pubs);
    })
    .catch(err => {
      const container = document.getElementById('pubsContainer');
      container.innerHTML = '<div class="alert alert-warning mt-4">' +
        'Could not load publications. Please see our ' +
        '<a href="https://scholar.google.com/citations?user=Ay6wT1MAAAAJ&hl=en" target="_blank">Google Scholar profile</a>.' +
        '</div>';
      console.error(err);
    });
})();
