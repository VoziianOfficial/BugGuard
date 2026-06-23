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

    const createServiceLink = (service) => {
        const link = document.createElement('a');
        link.href = service.file;
        link.textContent = service.title;
        return link;
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
                    link.innerHTML = `
                        <span>${service.title}</span>
                    `;
                }

                container.appendChild(link);
            });
        });

        qsa('[data-service-select]').forEach((select) => {
            const currentValue = select.value;

            select.innerHTML = '<option value="">Choose service type</option>';

            (config.services || []).forEach((service) => {
                const option = document.createElement('option');
                option.value = service.title;
                option.textContent = service.title;
                select.appendChild(option);
            });

            if (currentValue) {
                select.value = currentValue;
            }
        });
    };

    const initActiveLinks = () => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        qsa('.site-nav__link, .mobile-menu__nav a, .site-footer a').forEach((link) => {
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

    const initHomeFaqSwiper = () => {
        const swiperElement = qs('[data-home-faq-swiper]');

        if (!swiperElement || typeof Swiper === 'undefined') return;

        new Swiper(swiperElement, {
            slidesPerView: 1,
            spaceBetween: 18,
            loop: true,
            speed: 650,
            grabCursor: true,
            autoHeight: false,
            keyboard: {
                enabled: true
            },
            pagination: {
                el: '[data-home-faq-pagination]',
                clickable: true
            },
            navigation: {
                nextEl: '[data-home-faq-next]',
                prevEl: '[data-home-faq-prev]'
            },
            breakpoints: {
                0: {
                    slidesPerView: 1,
                    spaceBetween: 14
                },
                768: {
                    slidesPerView: 1,
                    spaceBetween: 18
                },
                1100: {
                    slidesPerView: 1,
                    spaceBetween: 22
                }
            },
            on: {
                init: () => {
                    if (window.AOS) {
                        window.setTimeout(() => AOS.refreshHard(), 120);
                    }
                }
            }
        });
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

    const initSwitchers = () => {
        qsa('[data-switcher]').forEach((switcher) => {
            const buttons = qsa('[data-switcher-button]', switcher);
            const title = qs('[data-switcher-title]', switcher);
            const text = qs('[data-switcher-text]', switcher);
            const panel = qs('.reason-panel', switcher);

            if (!buttons.length || !title || !text) return;

            let panelTimer = null;

            const updatePanelContent = (button) => {
                const nextTitle = button.dataset.switcherTitle || '';
                const nextText = button.dataset.switcherText || '';

                if (!panel || (title.textContent === nextTitle && text.textContent === nextText)) {
                    title.textContent = nextTitle;
                    text.textContent = nextText;
                    return;
                }

                window.clearTimeout(panelTimer);
                panel.classList.add('is-transitioning');

                panelTimer = window.setTimeout(() => {
                    title.textContent = nextTitle;
                    text.textContent = nextText;
                    panel.classList.remove('is-transitioning');
                }, 160);
            };

            const activateButton = (button) => {
                buttons.forEach((item) => {
                    item.classList.remove('is-active');
                    item.setAttribute('aria-selected', 'false');
                });

                button.classList.add('is-active');
                button.setAttribute('aria-selected', 'true');
                updatePanelContent(button);
            };

            buttons.forEach((button, index) => {
                button.setAttribute('role', 'tab');
                button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');

                button.addEventListener('click', () => activateButton(button));
            });

            activateButton(buttons.find((button) => button.classList.contains('is-active')) || buttons[0]);
        });
    };

    const initContactForm = () => {
        const form = qs('[data-contact-form]');
        const status = qs('[data-form-status]', form || document);

        if (!form || !status) return;

        status.hidden = false;
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-hidden', 'true');
        status.classList.add('is-hidden');

        const resetStatus = () => {
            status.className = 'form-status is-hidden';
            status.setAttribute('aria-hidden', 'true');
            status.textContent = '';
        };

        const showStatus = (type, message) => {
            status.className = `form-status form-status--${type}`;
            status.setAttribute('aria-hidden', 'false');
            status.textContent = message;
        };

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const submitButton = qs('button[type="submit"]', form);
            const formData = new FormData(form);

            qsa('.is-invalid', form).forEach((field) => {
                field.classList.remove('is-invalid');
            });

            resetStatus();

            let hasError = false;

            qsa('input[required], select[required], textarea[required]', form).forEach((field) => {
                const isCheckbox = field.type === 'checkbox';
                const isInvalid = isCheckbox ? !field.checked : !String(field.value || '').trim();

                if (isInvalid) {
                    field.classList.add('is-invalid');
                    hasError = true;
                }
            });

            if (hasError) {
                showStatus('error', 'Please complete all required fields before submitting.');
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.dataset.originalText = submitButton.innerHTML;
                submitButton.innerHTML = 'Sending...';
            }

            try {
                const response = await fetch(form.getAttribute('action') || 'contact.php', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showStatus('success', result.message || 'Your request has been submitted.');
                    form.reset();
                } else {
                    showStatus('error', result.message || 'Something went wrong. Please try again.');
                }
            } catch (error) {
                showStatus('error', 'Something went wrong. Please try again or contact us directly.');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = submitButton.dataset.originalText || 'Submit Request';
                }

                if (window.AOS) {
                    AOS.refresh();
                }
            }
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

    function initReasonSwitcher() {
        const switchers = document.querySelectorAll('[data-switcher]');

        switchers.forEach((switcher) => {
            const buttons = switcher.querySelectorAll('[data-switcher-button]');
            const panelTitle = switcher.querySelector('[data-switcher-title]:not([data-switcher-button])');
            const panelText = switcher.querySelector('[data-switcher-text]:not([data-switcher-button])');
            const panel = switcher.querySelector('.reason-panel');

            if (!buttons.length || !panelTitle || !panelText || !panel) return;

            buttons.forEach((button) => {
                button.addEventListener('click', () => {
                    buttons.forEach((item) => item.classList.remove('is-active'));
                    button.classList.add('is-active');

                    const newTitle = button.dataset.switcherTitle;
                    const newText = button.dataset.switcherText;

                    panel.classList.add('is-transitioning');

                    window.setTimeout(() => {
                        panelTitle.textContent = newTitle;
                        panelText.textContent = newText;
                        panel.classList.remove('is-transitioning');
                    }, 180);
                });
            });
        });
    }

    function initProviderPromptsSwiper() {
        const swiperElement = document.querySelector('[data-provider-prompts-swiper]');

        if (!swiperElement || typeof Swiper === 'undefined') return;

        new Swiper(swiperElement, {
            loop: true,
            speed: 700,
            slidesPerView: 1,
            spaceBetween: 18,
            grabCursor: true,
            effect: 'creative',
            creativeEffect: {
                prev: {
                    translate: ['-8%', 0, -90],
                    opacity: 0.35
                },
                next: {
                    translate: ['8%', 0, -90],
                    opacity: 0.35
                }
            },
            navigation: {
                prevEl: '[data-provider-prompts-prev]',
                nextEl: '[data-provider-prompts-next]'
            },
            pagination: {
                el: '[data-provider-prompts-pagination]',
                clickable: true
            }
        });
    }

    const init = () => {
        initConfigInjection();
        initActiveLinks();
        initHeaderDropdown();
        initMobileMenu();
        initCookieBanner();
        initHomeFaqSwiper();
        initSmoothAccordions();
        initSwitchers();
        initContactForm();
        initHeaderScrollState();
        initLibraries();
        initReasonSwitcher();
        initProviderPromptsSwiper();

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
