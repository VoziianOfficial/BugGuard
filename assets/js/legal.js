'use strict';

(function () {
    const config = window.SiteConfig || {};
    const AOS_REFRESH_DELAY = 520;

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
        panel.setAttribute('aria-hidden', 'true');

        const openDropdown = () => {
            window.clearTimeout(closeTimer);
            dropdown.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            panel.setAttribute('aria-hidden', 'false');
        };

        const closeDropdown = (immediate = false) => {
            const closeAction = () => {
                dropdown.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
                panel.setAttribute('aria-hidden', 'true');
            };

            window.clearTimeout(closeTimer);

            if (immediate) {
                closeAction();
                return;
            }

            closeTimer = window.setTimeout(() => {
                closeAction();
            }, 280);
        };

        dropdown.addEventListener('mouseenter', openDropdown);
        dropdown.addEventListener('mouseleave', closeDropdown);
        dropdown.addEventListener('focusin', openDropdown);
        dropdown.addEventListener('focusout', (event) => {
            if (dropdown.contains(event.relatedTarget)) return;
            closeDropdown();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeDropdown(true);
            }
        });
    };

    const initMobileMenu = () => {
        const menu = qs('[data-mobile-menu]');
        const openButton = qs('[data-menu-toggle]');
        const closeButton = qs('[data-menu-close]');

        if (!menu || !openButton || !closeButton) return;

        const setMenuState = (isOpen) => {
            menu.classList.toggle('is-open', isOpen);
            menu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            openButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            document.body.classList.toggle('menu-open', isOpen);
        };

        const openMenu = () => {
            setMenuState(true);
        };

        const closeMenu = () => {
            setMenuState(false);
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

    const refreshAOS = (delay = AOS_REFRESH_DELAY) => {
        if (!window.AOS) return;
        window.setTimeout(() => AOS.refresh(), delay);
    };

    const initSmoothAccordions = () => {
        const accordionGroups = qsa('[data-accordion], [data-service-accordion]');

        if (!accordionGroups.length) return;

        const refreshOpenPanels = () => {
            qsa(
                '.accordion__item.is-open [data-accordion-panel], .service-accordion__item.is-open .service-accordion__panel'
            ).forEach((panel) => {
                panel.style.maxHeight = `${panel.scrollHeight}px`;
            });
        };

        accordionGroups.forEach((accordion) => {
            const items = qsa('[data-accordion-item], .service-accordion__item', accordion);

            if (!items.length) return;

            const closeItem = (item) => {
                const button = qs('[data-accordion-button], .service-accordion__button', item);
                const panel = qs('[data-accordion-panel], .service-accordion__panel', item);

                if (!button || !panel) return;

                item.classList.remove('is-open');
                button.setAttribute('aria-expanded', 'false');
                panel.setAttribute('aria-hidden', 'true');
                panel.style.maxHeight = '0px';
            };

            const openItem = (item) => {
                const button = qs('[data-accordion-button], .service-accordion__button', item);
                const panel = qs('[data-accordion-panel], .service-accordion__panel', item);

                if (!button || !panel) return;

                item.classList.add('is-open');
                button.setAttribute('aria-expanded', 'true');
                panel.setAttribute('aria-hidden', 'false');
                panel.style.maxHeight = `${panel.scrollHeight}px`;
            };

            items.forEach((item, index) => {
                const button = qs('[data-accordion-button], .service-accordion__button', item);
                const panel = qs('[data-accordion-panel], .service-accordion__panel', item);

                if (!button || !panel) return;

                panel.hidden = false;
                panel.style.overflow = 'hidden';

                const isOpen = item.classList.contains('is-open') || index === 0;

                if (isOpen) {
                    openItem(item);
                } else {
                    closeItem(item);
                }

                if (!button.dataset.accordionBound) {
                    button.addEventListener('click', () => {
                        const isCurrentlyOpen = item.classList.contains('is-open');

                        items.forEach((otherItem) => {
                            if (otherItem !== item) {
                                closeItem(otherItem);
                            }
                        });

                        if (isCurrentlyOpen) {
                            closeItem(item);
                        } else {
                            openItem(item);
                        }

                        refreshAOS();
                    });

                    button.dataset.accordionBound = 'true';
                }
            });

            qsa('img', accordion).forEach((image) => {
                image.addEventListener('load', refreshOpenPanels);
            });
        });

        let resizeFrame = null;

        window.addEventListener('resize', () => {
            if (resizeFrame) {
                window.cancelAnimationFrame(resizeFrame);
            }

            resizeFrame = window.requestAnimationFrame(refreshOpenPanels);
        }, { passive: true });

        window.addEventListener('load', refreshOpenPanels);
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
                duration: 850,
                easing: 'ease-out-cubic',
                once: true,
                offset: 70,
                delay: 0,
                mirror: false,
                anchorPlacement: 'top-bottom'
            });
        }
    };

    const init = () => {
        initConfigInjection();
        initActiveLinks();
        initHeaderDropdown();
        initMobileMenu();
        initCookieBanner();
        initSmoothAccordions();
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
