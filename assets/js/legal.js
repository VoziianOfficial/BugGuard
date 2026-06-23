'use strict';

(function () {
    const config = window.SiteConfig || {};

    const qs = (selector, parent = document) => parent.querySelector(selector);
    const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

    const safeText = (value, fallback = '') => {
        if (value === undefined || value === null) return fallback;
        return String(value);
    };

    const setText = (selector, value) => {
        qsa(selector).forEach((element) => {
            element.textContent = safeText(value);
        });
    };

    const setHref = (selector, href) => {
        qsa(selector).forEach((element) => {
            element.setAttribute('href', href);
        });
    };

    const createServiceLink = (service) => {
        const link = document.createElement('a');
        link.href = service.file;
        link.textContent = service.title;
        return link;
    };

    const initConfigInjection = () => {
        const brandName = config.brand?.name || config.company?.name || 'BugGuard';
        const phoneRaw = config.contact?.phoneRaw || '';
        const phoneDisplay = config.contact?.phoneDisplay || '';
        const email = config.contact?.email || '';
        const address = config.company?.address || '';
        const companyId = config.company?.companyId || '';

        setText('[data-brand-name]', brandName);
        setText('[data-phone-text]', phoneDisplay);
        setText('[data-email-text]', email);
        setText('[data-company-address]', address);
        setText('[data-company-id]', companyId);
        setText('[data-footer-description]', config.footer?.description || '');
        setText('[data-footer-copyright]', config.footer?.copyright || '');
        setText('[data-legal-disclaimer]', config.legal?.disclaimer || '');
        setText('[data-current-year]', new Date().getFullYear());

        if (phoneRaw) {
            setHref('[data-phone-link]', `tel:${phoneRaw}`);
        }

        if (email) {
            setHref('[data-email-link]', `mailto:${email}`);
        }

        qsa('[data-service-links]').forEach((container) => {
            container.innerHTML = '';

            (config.services || []).forEach((service) => {
                const link = createServiceLink(service);

                if (container.dataset.serviceLinks === 'mobile') {
                    link.innerHTML = `<span>${service.title}</span>`;
                }

                container.appendChild(link);
            });
        });
    };

    const initActiveLinks = () => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        qsa('.site-nav__link, .mobile-menu__nav a, .site-footer a, [data-service-links] a').forEach((link) => {
            const href = link.getAttribute('href');

            if (!href) return;

            const cleanHref = href.split('#')[0];

            if (cleanHref === currentPage) {
                link.classList.add('is-active');
            }
        });
    };

    const initHeaderDropdown = () => {
        const dropdown = qs('[data-dropdown]');
        const trigger = qs('[data-dropdown-trigger]');
        const panel = qs('[data-dropdown-panel]');

        if (!dropdown || !trigger || !panel) return;

        let closeTimer = null;

        const openDropdown = () => {
            window.clearTimeout(closeTimer);
            dropdown.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
        };

        const closeDropdown = () => {
            closeTimer = window.setTimeout(() => {
                dropdown.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
            }, 220);
        };

        dropdown.addEventListener('mouseenter', openDropdown);
        dropdown.addEventListener('mouseleave', closeDropdown);
        dropdown.addEventListener('focusin', openDropdown);
        dropdown.addEventListener('focusout', closeDropdown);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                dropdown.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
    };

    const initMobileMenu = () => {
        const menu = qs('[data-mobile-menu]');
        const openButton = qs('[data-menu-toggle]');
        const closeButton = qs('[data-menu-close]');

        if (!menu || !openButton || !closeButton) return;

        const openMenu = () => {
            menu.classList.add('is-open');
            menu.setAttribute('aria-hidden', 'false');
            openButton.setAttribute('aria-expanded', 'true');
            document.body.classList.add('menu-open');
        };

        const closeMenu = () => {
            menu.classList.remove('is-open');
            menu.setAttribute('aria-hidden', 'true');
            openButton.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        };

        openButton.addEventListener('click', openMenu);
        closeButton.addEventListener('click', closeMenu);

        menu.addEventListener('click', (event) => {
            if (event.target === menu) {
                closeMenu();
            }
        });

        qsa('a', menu).forEach((link) => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && menu.classList.contains('is-open')) {
                closeMenu();
            }
        });
    };

    const initCookieBanner = () => {
        const banner = qs('[data-cookie-banner]');
        const acceptButton = qs('[data-cookie-accept]');
        const cancelButton = qs('[data-cookie-cancel]');

        if (!banner || !acceptButton || !cancelButton) return;

        const cookieKey = 'bugguard_cookie_choice';
        const savedChoice = localStorage.getItem(cookieKey);

        if (!savedChoice) {
            window.setTimeout(() => {
                banner.classList.add('is-visible');
                banner.setAttribute('aria-hidden', 'false');
            }, 600);
        }

        const saveChoice = (choice) => {
            localStorage.setItem(cookieKey, choice);
            banner.classList.remove('is-visible');
            banner.setAttribute('aria-hidden', 'true');
        };

        acceptButton.addEventListener('click', () => saveChoice('accepted'));
        cancelButton.addEventListener('click', () => saveChoice('cancelled'));
    };

    const initLegalSidebar = () => {
        const links = qsa('.legal-sidebar a[href^="#"]');
        const sections = links
            .map((link) => {
                const id = link.getAttribute('href');
                const section = id ? qs(id) : null;

                return {
                    link,
                    section
                };
            })
            .filter((item) => item.section);

        if (!sections.length) return;

        const setActive = () => {
            let activeItem = sections[0];

            sections.forEach((item) => {
                const rect = item.section.getBoundingClientRect();

                if (rect.top <= 170) {
                    activeItem = item;
                }
            });

            sections.forEach((item) => {
                item.link.classList.toggle('is-active', item === activeItem);
            });
        };

        links.forEach((link) => {
            link.addEventListener('click', () => {
                links.forEach((item) => item.classList.remove('is-active'));
                link.classList.add('is-active');
            });
        });

        setActive();
        window.addEventListener('scroll', setActive, { passive: true });
    };

    const initHeaderScrollState = () => {
        const header = qs('[data-site-header]');

        if (!header) return;

        const updateHeader = () => {
            header.classList.toggle('is-scrolled', window.scrollY > 20);
        };

        updateHeader();
        window.addEventListener('scroll', updateHeader, { passive: true });
    };

    const initLibraries = () => {
        if (window.lucide) {
            lucide.createIcons();
        }

        if (window.AOS) {
            AOS.init({
                duration: 720,
                easing: 'ease-out-cubic',
                once: true,
                offset: 80,
                delay: 0,
                mirror: false
            });
        }
    };

    const init = () => {
        initConfigInjection();
        initActiveLinks();
        initHeaderDropdown();
        initMobileMenu();
        initCookieBanner();
        initLegalSidebar();
        initHeaderScrollState();
        initLibraries();

        window.addEventListener('load', () => {
            if (window.AOS) {
                AOS.refreshHard();
            }

            if (window.lucide) {
                lucide.createIcons();
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();