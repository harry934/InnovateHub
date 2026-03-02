const StaggeredMenu = (function() {
    let state = {
        open: false,
        busy: false,
        config: {
            position: 'right',
            colors: ['#1a5e4f', '#f3a813', '#1a5e4f'],
            items: [],
            socialItems: [],
            displaySocials: false,
            displayItemNumbering: true,
            logoUrl: 'img/logo.svg',
            accentColor: '#1a5e4f',
            closeOnClickAway: true,
            menuButtonColor: '#fff',
            openMenuButtonColor: '#fff',
            onMenuOpen: null,
            onMenuClose: null
        }
    };

    let elements = {};

    function init(config) {
        if (!window.gsap) {
            console.error("StaggeredMenu: GSAP library is required but not found.");
            return;
        }
        state.config = { ...state.config, ...config };
        console.log("StaggeredMenu: Initializing with items:", state.config.items.length);
        renderBaseHTML();
        cacheElements();
        setupInitialState();
        bindEvents();
    }

    function renderBaseHTML() {
        const existing = document.querySelector('.staggered-menu-wrapper');
        if (existing) existing.remove();

        const menuHTML = `
            <div class="staggered-menu-wrapper" data-position="${state.config.position}">
                <div class="sm-prelayers" aria-hidden="true">
                    ${(state.config.colors || ['#1a5e4f', '#f3a813']).map((color, i) => 
                        `<div class="sm-prelayer" style="background: ${color}"></div>`
                    ).join('')}
                </div>
                <header class="staggered-menu-header" aria-label="Main navigation header">
                    <div class="sm-header-left">
                        <div class="sm-logo" aria-label="Logo">
                            <img src="${state.config.logoUrl}" alt="Logo" class="sm-logo-img" draggable="false">
                            <span class="sm-site-name">Innovate Hub</span>
                        </div>
                    </div>
                    
                    <div class="sm-header-right">
                        ${window.location.pathname.includes('dashboard') ? `
                        <div class="sm-header-actions">
                            <button id="notificationBell" class="nav-notif-btn" title="Notifications" aria-label="Notifications">
                                <i class="fa fa-bell"></i>
                                <span class="notif-dot d-none"></span>
                            </button>
                            
                            <div id="userInitialCircle" class="nav-profile-circle" title="User Profile">
                                US
                            </div>
                            
                            <button class="nav-logout-btn d-none d-md-flex" onclick="logout()" aria-label="Logout">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 16L21 12M21 12L17 8M21 12H9M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                        ` : ''}

                        <button class="sm-toggle" type="button" aria-controls="staggered-menu-panel" aria-label="Open menu">
                            <span class="sm-toggle-textWrap" aria-hidden="true">
                                <span class="sm-toggle-textInner">
                                    <span class="sm-toggle-line">Menu</span>
                                    <span class="sm-toggle-line">Close</span>
                                </span>
                            </span>
                            <span class="sm-icon" aria-hidden="true">
                                <span class="sm-icon-line"></span>
                                <span class="sm-icon-line sm-icon-line-v"></span>
                            </span>
                        </button>
                    </div>
                </header>
                <aside id="staggered-menu-panel" class="staggered-menu-panel">
                    <div class="sm-panel-inner">
                        ${(() => {
                            const items = state.config.items || [];
                            if (!items.length) return `<p style="color:rgba(255,255,255,0.5);padding:1rem">No items configured.</p>`;
                            
                            // Render all items with numbers, no grouping needed
                            const rows = items.map((item, idx) => `
                                <li class="sm-panel-itemWrap">
                                    <a class="sm-panel-item" href="${item.link}" aria-label="${item.ariaLabel || item.label}" data-index="${String(idx + 1).padStart(2, '0')}">
                                        <span class="sm-panel-itemLabel">${item.label}</span><span class="sm-item-num">${String(idx + 1).padStart(2, '0')}</span>
                                    </a>
                                </li>
                            `).join('');

                            return `
                                <ul class="sm-panel-list" role="list" data-numbering="true">
                                    ${rows}
                                </ul>
                            `;
                        })()}
                        <div class="sm-panel-footer">
                            <strong>Innovate Hub</strong> &nbsp;· v2
                        </div>
                    </div>
                </aside>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', menuHTML);
        console.log("StaggeredMenu: HTML injected into DOM.");
    }

    function cacheElements() {
        const wrapper = document.querySelector('.staggered-menu-wrapper');
        elements = {
            wrapper: wrapper,
            preLayers: Array.from(wrapper.querySelectorAll('.sm-prelayer')),
            panelSingle: wrapper.querySelector('.staggered-menu-panel'),
            toggle: wrapper.querySelector('.sm-toggle'),
            textInner: wrapper.querySelector('.sm-toggle-textInner'),
            icon: wrapper.querySelector('.sm-icon'),
            itemLabels: Array.from(wrapper.querySelectorAll('.sm-panel-itemLabel')),
            numberItems: Array.from(wrapper.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')),
            socialTitle: wrapper.querySelector('.sm-socials-title'),
            socialLinks: Array.from(wrapper.querySelectorAll('.sm-socials-link'))
        };
        console.log("StaggeredMenu: Elements cached:", {
            panel: !!elements.panelSingle,
            items: elements.itemLabels.length,
            layers: elements.preLayers.length
        });
    }

    function setupInitialState() {
        const offscreen = 100; // always right for drawer
        // pre-layers cover full page behind the panel
        gsap.set(elements.preLayers, { xPercent: 100, overwrite: 'auto' });
        // panel starts off-screen to the right
        gsap.set(elements.panelSingle, { x: '100%', overwrite: 'auto' });
        // items start hidden (translateY so they clip into panel)
        gsap.set(elements.itemLabels, { y: 30, opacity: 0 });
        
        elements.wrapper.style.setProperty('--sm-accent', state.config.accentColor || '#1a5e4f');
    }

    function bindEvents() {
        elements.toggle.addEventListener('click', toggleMenu);

        if (state.config.closeOnClickAway) {
            document.addEventListener('mousedown', (e) => {
                if (state.open && elements.panelSingle && !elements.panelSingle.contains(e.target) && !elements.toggle.contains(e.target)) {
                    closeMenu();
                }
            });
        }

        elements.wrapper.querySelectorAll('.sm-panel-item').forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(closeMenu, 150);
            });
        });
    }

    function toggleMenu() {
        console.log("StaggeredMenu: Toggling menu. Current open state:", state.open);
        if (state.busy) return;
        state.open ? closeMenu() : openMenu();
    }

    function openMenu() {
        if (state.busy) return;
        state.busy = true;
        state.open = true;
        elements.wrapper.setAttribute('data-open', 'true');

        if (state.config.onMenuOpen) state.config.onMenuOpen();

        const tl = gsap.timeline({
            onComplete: () => { state.busy = false; console.log("StaggeredMenu: Open complete."); }
        });

        // Background layers (full-width sweep behind panel)
        elements.preLayers.forEach((el, i) => {
            tl.to(el, { xPercent: 0, duration: 0.45, ease: 'power4.out', overwrite: 'auto' }, i * 0.06);
        });

        // Panel slides in from right
        tl.to(elements.panelSingle, { x: 0, duration: 0.55, ease: 'power4.out', overwrite: 'auto' }, 0.1);

        // Items fade up into view
        console.log("StaggeredMenu: animating", elements.itemLabels.length, "labels");
        tl.to(elements.itemLabels, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power3.out',
            stagger: 0.06
        }, 0.3);

        animateIcon(true);
        animateText(true);
        animateColor(true);
    }

    function closeMenu() {
        if (state.busy) return;
        state.busy = true;
        state.open = false;

        if (state.config.onMenuClose) state.config.onMenuClose();

        // Hide items immediately
        gsap.set(elements.itemLabels, { y: 30, opacity: 0 });

        // Slide panel + layers back right
        gsap.to(elements.panelSingle, {
            x: '100%',
            duration: 0.35,
            ease: 'power3.in',
            overwrite: 'auto'
        });

        gsap.to(elements.preLayers, {
            xPercent: 100,
            duration: 0.4,
            ease: 'power3.in',
            overwrite: 'auto',
            onComplete: () => {
                elements.wrapper.removeAttribute('data-open');
                state.busy = false;
                console.log("StaggeredMenu: Close complete.");
            }
        });

        animateIcon(false);
        animateText(false);
        animateColor(false);
    }

    function animateIcon(opening) {
        gsap.to(elements.icon, {
            rotate: opening ? 225 : 0,
            duration: opening ? 0.8 : 0.4,
            ease: opening ? 'power4.out' : 'power3.inOut',
            overwrite: 'auto'
        });
    }

    function animateColor(opening) {
        if (state.config.openMenuButtonColor) {
            gsap.to(elements.toggle, {
                color: opening ? state.config.openMenuButtonColor : state.config.menuButtonColor,
                duration: 0.3,
                delay: opening ? 0.15 : 0,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        }
    }

    function animateText(opening) {
        const inner = elements.textInner;
        if (!inner) return;

        const currentLabel = opening ? 'Menu' : 'Close';
        const targetLabel = opening ? 'Close' : 'Menu';
        
        const cycles = 3;
        const seq = [currentLabel];
        let last = currentLabel;
        for (let i = 0; i < cycles; i++) {
            last = last === 'Menu' ? 'Close' : 'Menu';
            seq.push(last);
        }
        if (last !== targetLabel) seq.push(targetLabel);
        seq.push(targetLabel);
        
        inner.innerHTML = seq.map(text => `<span class="sm-toggle-line">${text}</span>`).join('');
        
        gsap.set(inner, { yPercent: 0 });
        const lineCount = seq.length;
        const finalShift = ((lineCount - 1) / lineCount) * 100;
        
        gsap.to(inner, {
            yPercent: -finalShift,
            duration: 0.5 + (lineCount * 0.07),
            ease: 'power4.out',
            overwrite: 'auto'
        });
    }

    function updateInitials(name) {
        const circle = document.getElementById('userInitialCircle');
        if (circle && window.getInitials) {
            circle.textContent = window.getInitials(name);
        }
    }

    return {
        init: init,
        open: openMenu,
        close: closeMenu,
        toggle: toggleMenu,
        updateInitials: updateInitials
    };
})();

window.StaggeredMenu = StaggeredMenu;
