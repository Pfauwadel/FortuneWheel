(function () {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin');
    const resultDiv = document.getElementById('result');
    const brandEl = document.getElementById('wheel-brand');
    const hubEl = document.getElementById('wheel-hub');
    const pointerEl = document.getElementById('pointer');
    const tickerTrack = document.getElementById('ticker-track');

    const GOLD_STROKE = 'rgba(208,181,128,0.45)';

    let loadedConfig = null;
    let segments = [];
    let colors = [];
    let accentColor = '#ee3126';
    let duoTones = ['#ee3126', '#242932'];
    let settings = {};
    let isSpinning = false;
    let currentRotation = 0;
    let idleTimer = null;
    let resizeTimer = null;

    function colorLuminance(color) {
        const num = parseInt(color.replace('#', ''), 16);
        return (0.299 * ((num >> 16) & 0xff) + 0.587 * ((num >> 8) & 0xff) + 0.114 * (num & 0xff)) / 255;
    }

    // Texte clair ou sombre selon la luminosité du segment.
    function readableTextColor(color) {
        return colorLuminance(color) > 0.6 ? '#15171d' : '#ffffff';
    }

    function darkestColor(colorList) {
        return colorList.reduce((darkest, c) => (colorLuminance(c) < colorLuminance(darkest) ? c : darkest), colorList[0]);
    }

    function shadeColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const clamp = (v) => Math.min(255, Math.max(0, v));
        const R = clamp((num >> 16) + amt);
        const G = clamp(((num >> 8) & 0x00FF) + amt);
        const B = clamp((num & 0x0000FF) + amt);
        return '#' + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
    }

    // Deux teintes dérivées du thème : couleur d'accent + teinte la plus
    // sombre de la palette (repli sur un charbon neutre si la palette est
    // entièrement claire, comme le thème Pastel).
    function resolveDuoTones(colorList, accent) {
        const dark = darkestColor(colorList);
        return [accent, colorLuminance(dark) < 0.28 ? dark : '#242932'];
    }

    function segmentFill(index) {
        if (settings.wheelToneMode === 'palette') return colors[index % colors.length];
        return duoTones[index % 2];
    }

    function isDepleted(segment) {
        return segment.stock !== null && segment.stock !== undefined && segment.stock <= 0;
    }

    function iconMarkup(segment, sizePx, color) {
        if (segment.imageUrl) {
            return `<img src="${segment.imageUrl}" alt="" style="width:${sizePx}px;height:${sizePx}px;object-fit:contain;">`;
        }
        return window.IconLibrary.renderSVG(segment.iconId, { size: 0 })
            .replace('<svg ', `<svg style="width:${sizePx}px;height:${sizePx}px;color:${color};" `);
    }

    function generateWheel() {
        const numSegments = segments.length;
        wheel.innerHTML = '';
        if (numSegments === 0) return;

        const size = wheel.offsetWidth || 600;
        const labelFont = Math.max(11, Math.round(size * 0.034));
        const iconSize = Math.max(14, Math.round(size * 0.052));
        const labelOffset = Math.round(size * 0.34);

        const totalWeight = segments.reduce((sum, elem) => sum + elem.weight, 0);
        let currentAngle = 0;
        let labelHtml = '';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.inset = '0';
        svg.style.pointerEvents = 'none';

        segments.forEach((segment, index) => {
            const segmentAngle = (segment.weight / totalWeight) * 360;
            // Un arc SVG ne peut pas boucler exactement à 360°.
            const arcSweep = segmentAngle >= 359.99 ? 359.99 : segmentAngle;
            const startRad = currentAngle * Math.PI / 180;
            const endRad = (currentAngle + arcSweep) * Math.PI / 180;

            const x1 = 50 + 50 * Math.cos(startRad);
            const y1 = 50 + 50 * Math.sin(startRad);
            const x2 = 50 + 50 * Math.cos(endRad);
            const y2 = 50 + 50 * Math.sin(endRad);
            const largeArc = segmentAngle > 180 ? 1 : 0;

            const depleted = isDepleted(segment);
            const fill = segmentFill(index);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`);
            path.setAttribute('fill', depleted ? '#3a3f48' : fill);
            path.setAttribute('stroke', GOLD_STROKE);
            path.setAttribute('stroke-width', '0.25');
            path.setAttribute('pointer-events', 'none');
            path.setAttribute('transform', 'rotate(-90 50 50)');
            svg.appendChild(path);

            const textColor = readableTextColor(depleted ? '#3a3f48' : fill);
            const mid = currentAngle + segmentAngle / 2;
            // Moitié basse : libellé retourné de 180° pour rester lisible.
            const flipped = mid > 90 && mid < 270;
            const rotation = flipped ? mid + 180 : mid;
            const translate = flipped ? labelOffset : -labelOffset;

            labelHtml += `
                <div class="label${flipped ? ' flipped' : ''}${depleted ? ' depleted' : ''}" style="
                    transform: translate(-50%, -50%) rotate(${rotation}deg) translateY(${translate}px);
                    color: ${textColor};
                    font-size: ${labelFont}px;
                ">
                    ${iconMarkup(segment, iconSize, textColor)}
                    <span class="label-name">${segment.description}${depleted ? '<span class="depleted-tag">Épuisé</span>' : ''}</span>
                </div>
            `;

            segment.segmentRange = [currentAngle, currentAngle + segmentAngle];
            currentAngle += segmentAngle;
        });

        wheel.appendChild(svg);
        wheel.insertAdjacentHTML('beforeend', labelHtml);
    }

    // Bandeau bas : liste des lots, dupliquée pour un défilement continu.
    function renderTicker() {
        if (!tickerTrack) return;
        const items = segments.map((segment) => `
            <div class="ticker-item${isDepleted(segment) ? ' depleted' : ''}">
                ${iconMarkup(segment, 24, '#d0b580')}
                <span>${segment.description}</span>
                <i></i>
            </div>
        `).join('');
        tickerTrack.innerHTML = items + items;
    }

    function pickWeightedSegment(eligible) {
        const totalWeight = eligible.reduce((sum, s) => sum + s.weight, 0);
        let r = Math.random() * totalWeight;
        for (const seg of eligible) {
            if (r < seg.weight) return seg;
            r -= seg.weight;
        }
        return eligible[eligible.length - 1];
    }

    function findSegmentIndexByAngle(angle) {
        for (let i = 0; i < segments.length; i++) {
            const [start, end] = segments[i].segmentRange;
            if (angle >= start && angle < end) return i;
        }
        return -1;
    }

    // Suit la rotation réelle pendant l'animation pour jouer un "tick" à
    // chaque frontière de segment franchie.
    function watchTicks(durationMs) {
        if (segments.length === 0) return;
        let lastIndex = -1;
        const start = performance.now();

        function frame(now) {
            if (now - start > durationMs + 80) return;
            const style = window.getComputedStyle(wheel);
            const match = style.transform && style.transform.match(/matrix\(([^)]+)\)/);
            if (match) {
                const parts = match[1].split(',').map(Number);
                const angleRad = Math.atan2(parts[1], parts[0]);
                let angle = 360 - (angleRad * (180 / Math.PI));
                if (angle < 0) angle += 360;
                const index = findSegmentIndexByAngle(angle);
                if (lastIndex !== -1 && index !== -1 && index !== lastIndex) {
                    if (settings.soundEnabled !== false) window.SoundFX.play('tick');
                    if (pointerEl) {
                        pointerEl.classList.remove('tick');
                        void pointerEl.offsetWidth;
                        pointerEl.classList.add('tick');
                    }
                }
                lastIndex = index;
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    function spin() {
        if (isSpinning) return;

        const eligible = segments.filter((s) => !isDepleted(s));
        if (eligible.length === 0) {
            resultDiv.textContent = 'Tous les lots sont épuisés';
            return;
        }

        isSpinning = true;
        spinButton.disabled = true;
        spinButton.classList.remove('attract');
        resultDiv.textContent = '';

        const winner = pickWeightedSegment(eligible);
        const [start, end] = winner.segmentRange;
        const span = end - start;
        const margin = span * 0.15;
        const pointAngle = start + margin + Math.random() * Math.max(0, span - margin * 2);

        const minTurns = Math.max(1, Math.round(settings.spinMinTurns || 5));
        const maxTurns = Math.max(minTurns, Math.round(settings.spinMaxTurns || 10));
        const extraTurns = minTurns + Math.floor(Math.random() * (maxTurns - minTurns + 1));

        const targetMod = (360 - pointAngle + 360) % 360;
        const completedTurns = Math.floor(currentRotation / 360);
        let totalRotation = (completedTurns + extraTurns) * 360 + targetMod;
        if (totalRotation <= currentRotation) totalRotation += 360;
        currentRotation = totalRotation;

        if (settings.soundEnabled !== false) window.SoundFX.play('spin');
        wheel.style.transform = `rotate(${totalRotation}deg)`;
        watchTicks(3000);

        wheel.addEventListener('transitionend', () => finishSpin(winner), { once: true });
    }

    function finishSpin(winner) {
        resultDiv.textContent = `Lot tiré · ${winner.description}`;

        if (winner.stock !== null && winner.stock !== undefined) {
            winner.stock = Math.max(0, winner.stock - 1);
            if (loadedConfig) window.ConfigStore.saveConfig(loadedConfig);
            generateWheel();
            renderTicker();
        }

        showGiftScreen(winner);

        if (settings.confettiEnabled !== false) triggerConfetti();
        if (settings.soundEnabled !== false) window.SoundFX.play('win');

        isSpinning = false;
        spinButton.disabled = false;
        resetIdleTimer();
    }

    function triggerConfetti() {
        const palette = [accentColor, '#d0b580', '#eeece0'];
        for (let i = 0; i < 110; i++) {
            const piece = document.createElement('div');
            const wide = i % 3 === 0;
            piece.style.cssText = `
                position: fixed; left: 50%; top: 40%;
                width: ${wide ? 6 : 9}px; height: ${wide ? 12 : 9}px;
                background: ${palette[i % palette.length]};
                border-radius: ${i % 4 === 0 ? '50%' : '1px'};
                pointer-events: none; z-index: 10000;
            `;
            document.body.appendChild(piece);

            const anim = piece.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                { transform: `translate(${Math.random() * 200 - 100}vw, ${Math.random() * 140 - 30}vh) rotate(${Math.random() * 720}deg) scale(1)`, opacity: 0.9, offset: 0.7 },
                { transform: `translate(${Math.random() * 220 - 110}vw, ${Math.random() * 160}vh) rotate(${Math.random() * 1080}deg) scale(1)`, opacity: 0 }
            ], { duration: 1600 + Math.random() * 1200, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' });
            anim.onfinish = () => piece.remove();
        }
    }

    function showGiftScreen(gift) {
        const displayMs = settings.resultDisplayMs || 3000;
        const overlay = document.createElement('div');
        overlay.id = 'gift-overlay';
        overlay.innerHTML = `
            <div class="gift-eyebrow"><i></i><span>Vous gagnez</span><i></i></div>
            <div class="gift-visual">${iconMarkup(gift, 0, '#ffffff') || ''}</div>
            <div class="gift-label">${gift.description}</div>
            <div class="gift-hint">Présentez cet écran à l'équipe du stand pour retirer votre lot.</div>
            <div class="gift-timer"><i></i></div>
        `;
        // L'icône du visuel est dimensionnée par la feuille de style (55 %) :
        // on retire les tailles en dur injectées par iconMarkup.
        const visualIcon = overlay.querySelector('.gift-visual svg, .gift-visual img');
        if (visualIcon) visualIcon.removeAttribute('style');

        document.body.appendChild(overlay);

        const bar = overlay.querySelector('.gift-timer i');
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            requestAnimationFrame(() => {
                overlay.classList.add('reveal');
                if (bar) {
                    bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: displayMs, easing: 'linear', fill: 'forwards' });
                }
            });
        });

        setTimeout(() => {
            overlay.classList.remove('reveal');
            setTimeout(() => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 500);
            }, 250);
        }, displayMs);
    }

    // Mode attraction : pulsation du bouton après une période d'inactivité.
    function resetIdleTimer() {
        spinButton.classList.remove('attract');
        if (idleTimer) clearTimeout(idleTimer);
        if (settings.attractModeEnabled === false) return;
        const seconds = settings.attractIdleSeconds || 45;
        idleTimer = setTimeout(() => {
            if (!isSpinning) spinButton.classList.add('attract');
        }, seconds * 1000);
    }

    function applyConfig(config) {
        loadedConfig = config;
        settings = config.settings;
        segments = config.segments;

        const theme = window.ThemeLibrary.resolve(settings);
        colors = theme.colors;
        accentColor = theme.accentColor;
        duoTones = resolveDuoTones(colors, accentColor);

        const title = settings.title || 'Roue de la Fortune';
        if (brandEl) brandEl.textContent = title;
        document.title = title;
        if (hubEl) hubEl.textContent = settings.hubText || 'KUHN';

        const root = document.documentElement.style;
        root.setProperty('--accent-color', accentColor);
        root.setProperty('--accent-color-dark', shadeColor(accentColor, -22));
        root.setProperty('--duo-dark', duoTones[1]);

        generateWheel();
        renderTicker();
        resetIdleTimer();
    }

    async function init() {
        applyConfig(await window.ConfigStore.loadConfig());
    }

    // Aperçu en direct depuis admin.html (jamais persisté ici).
    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        const data = event.data;
        if (data && data.type === 'wheel:preview-config' && !isSpinning) {
            applyConfig(window.ConfigStore.normalizeConfig(data.config));
        }
    });

    spinButton.addEventListener('click', spin);

    ['click', 'mousemove', 'keydown', 'touchstart'].forEach((evt) => {
        window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    // Les libellés sont dimensionnés en pixels d'après le diamètre réel :
    // on les régénère après un redimensionnement (ou une rotation d'écran).
    window.addEventListener('resize', () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (!isSpinning) generateWheel(); }, 200);
    });

    window.addEventListener('storage', (event) => {
        if (event.key === window.ConfigStore.STORAGE_KEY && !isSpinning) init();
    });

    init();
})();
