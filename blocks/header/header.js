import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/** Nationwide masthead logo (same asset as NBS preview site) */
const NATIONWIDE_LOGO_SRC =
  'https://main--nbs--waringme.aem.page/media_1728e027d05f4200263e001e0ce1a2e2ba39a5486.png'
  + '?width=400&format=webply&optimize=medium';

/**
 * Ensures the nav brand shows the Nationwide logo image.
 * @param {Element|null} navBrand
 */
function applyNationwideLogo(navBrand) {
  if (!navBrand) return;

  const setOnImg = (el) => {
    el.src = NATIONWIDE_LOGO_SRC;
    el.removeAttribute('srcset');
    el.alt = el.alt || 'Nationwide';
    el.loading = 'eager';
  };

  const picture = navBrand.querySelector('picture');
  if (picture) {
    picture.querySelectorAll('source').forEach((s) => s.remove());
    const picImg = picture.querySelector('img');
    if (picImg) {
      setOnImg(picImg);
      return;
    }
  }

  const directImg = navBrand.querySelector('img');
  if (directImg) {
    setOnImg(directImg);
    return;
  }

  let link = navBrand.querySelector('a[href]');
  if (!link) {
    link = document.createElement('a');
    link.href = '/';
    (navBrand.querySelector('.default-content-wrapper') || navBrand).prepend(link);
  }
  const logoImg = document.createElement('img');
  setOnImg(logoImg);
  link.prepend(logoImg);
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Standard 3-section structure: brand, sections, tools
  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Strip button classes from brand
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container').className = '';
    }
  }

  applyNationwideLogo(navBrand);

  // Strip button classes from sections and tools
  nav.querySelectorAll('.nav-sections .button, .nav-tools .button').forEach((button) => {
    button.className = '';
    const buttonContainer = button.closest('.button-container');
    if (buttonContainer) buttonContainer.className = '';
  });

  // Setup nav sections dropdowns
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // Add search box into the brand area (between logo and tools on desktop)
  const searchBox = document.createElement('div');
  searchBox.className = 'nav-search';
  searchBox.innerHTML = `<div class="nav-search-inner">
    <input type="text" placeholder="Search" aria-label="Search">
    <button type="button" aria-label="Search">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9 9.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0ZM14.5 2a7.5 7.5 0 0 0-5.963 12.05l-6.244 6.243a1 1 0 0 0 1.414 1.414l6.244-6.244A7.5 7.5 0 1 0 14.5 2Z" fill="currentColor"/>
      </svg>
    </button>
  </div>`;

  // Add Log in button to tools
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const toolsList = navTools.querySelector('ul');
    if (toolsList) {
      const loginBtn = document.createElement('li');
      loginBtn.className = 'nav-login';
      loginBtn.innerHTML = '<a href="https://onlinebanking.nationwide.co.uk/AccessManagement/IdentifyCustomer/IdentifyCustomer">Log in</a>';
      toolsList.append(loginBtn);
    }
  }

  // Insert search box after brand in the nav
  if (navBrand) navBrand.after(searchBox);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  // Personal/Business top bar above masthead
  const topBar = document.createElement('div');
  topBar.className = 'nav-top-bar';
  topBar.innerHTML = `<div class="nav-top-bar-inner"><ul>
    <li><a href="/" class="nav-top-bar-active">Personal</a></li>
    <li><a href="https://www.nationwide.co.uk/business">Business</a></li>
    <li class="nav-top-bar-demo"><span>Demo Website for Nationwide</span></li>
  </ul></div>`;

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(topBar);
  block.append(navWrapper);
}
