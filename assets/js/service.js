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

    const initAccordions = () => {
        qsa('[data-accordion]').forEach((accordion) => {
            const items = qsa('[data-accordion-item]', accordion);

            items.forEach((item, index) => {
                const button = qs('[data-accordion-button]', item);
                const panel = qs('[data-accordion-panel]', item);

                if (!button || !panel) return;

                const isOpen = item.classList.contains('is-open') || index === 0;

                button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                panel.hidden = !isOpen;

                if (isOpen) {
                    item.classList.add('is-open');
                }

                button.addEventListener('click', () => {
                    const currentlyOpen = item.classList.contains('is-open');

                    items.forEach((otherItem) => {
                        const otherButton = qs('[data-accordion-button]', otherItem);
                        const otherPanel = qs('[data-accordion-panel]', otherItem);

                        otherItem.classList.remove('is-open');

                        if (otherButton) {
                            otherButton.setAttribute('aria-expanded', 'false');
                        }

                        if (otherPanel) {
                            otherPanel.hidden = true;
                        }
                    });

                    if (!currentlyOpen) {
                        item.classList.add('is-open');
                        button.setAttribute('aria-expanded', 'true');
                        panel.hidden = false;
                    }

                    if (window.AOS) {
                        window.setTimeout(() => AOS.refresh(), 180);
                    }
                });
            });
        });
    };

    const initRelatedServiceCards = () => {
        const currentPage = window.location.pathname.split('/').pop() || '';
        const relatedContainers = qsa('[data-related-services]');

        if (!relatedContainers.length) return;

        relatedContainers.forEach((container) => {
            const existingCards = qsa('.related-card', container);

            if (existingCards.length) return;

            const relatedServices = (config.services || [])
                .filter((service) => service.file !== currentPage)
                .slice(0, 4);

            relatedServices.forEach((service, index) => {
                const card = document.createElement('a');

                card.className = 'related-card shine-surface';
                card.href = service.file;
                card.setAttribute('data-aos', 'fade-up');

                if (index) {
                    card.setAttribute('data-aos-delay', String(index * 70));
                }

                card.innerHTML = `
                    <img src="${service.heroImage || service.image}" alt="${service.title} provider matching category" width="760" height="520" loading="lazy">
                    <span class="photo-overlay"></span>
                    <h3>${service.title}</h3>
                `;

                container.appendChild(card);
            });
        });
    };

    const initServiceHeroData = () => {
        const currentPage = window.location.pathname.split('/').pop() || '';
        const service = (config.services || []).find((item) => item.file === currentPage);

        if (!service) return;

        setText('[data-current-service-title]', service.title);
        setText('[data-current-service-short-title]', service.shortTitle);
        setText('[data-current-service-description]', service.description);

        qsa('[data-current-service-icon]').forEach((element) => {
            element.setAttribute('data-lucide', service.icon || 'bug');
        });
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
        initServiceHeroData();
        initRelatedServiceCards();
        initActiveLinks();
        initHeaderDropdown();
        initMobileMenu();
        initCookieBanner();
        initAccordions();
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