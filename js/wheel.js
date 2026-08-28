(function () {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin');
    const resultDiv = document.getElementById('result');
    const titleEl = document.getElementById('wheel-title');
    const pointerEl = document.getElementById('pointer');

    let loadedConfig = null;
    let segments = [];
    let colors = [];
    let accentColor = '#ee3126';
    let settings = {};
    let isSpinning = false;
    let currentRotation = 0;
    let idleTimer = null;

    function lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (Math.min(255, R) << 16) + (Math.min(255, G) << 8) + Math.min(255, B)).toString(16).slice(1);
    }

    function colorLuminance(color) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = (num >> 16) & 0xff;
        const g = (num >> 8) & 0xff;
        const b = num & 0xff;
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    // Choisit un texte clair ou sombre selon la luminosité du segment, pour
    // que le libellé reste lisible quel que soit le thème (clair ou foncé).
    function readableTextColor(color) {
        return colorLuminance(color) > 0.6 ? '#1a1a1a' : '#ffffff';
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

    function isDepleted(segment) {
        return segment.stock !== null && segment.stock !== undefined && segment.stock <= 0;
    }

    function generateWheel() {
        const numSegments = segments.length;
        wheel.innerHTML = '';
        if (numSegments === 0) return;

        let labelHtml = '';
        let currentAngle = 0;
        const totalWeight = segments.reduce((sum, elem) => sum + elem.weight, 0);

        wheel.style.position = 'relative';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        segments.forEach((_, index) => {
            const color = colors[index % colors.length];
            const endColor = lightenColor(color, 20);

            const radialGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
            radialGradient.setAttribute('id', `grad${index}`);
            radialGradient.setAttribute('cx', '50%');
            radialGradient.setAttribute('cy', '50%');
            radialGradient.setAttribute('r', '75%');

            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', color);
            radialGradient.appendChild(stop1);

            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', endColor);
            radialGradient.appendChild(stop2);

            defs.appendChild(radialGradient);
        });

        const strokeGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        strokeGrad.setAttribute('id', 'strokeGrad');
        strokeGrad.setAttribute('x1', '0%');
        strokeGrad.setAttribute('y1', '0%');
        strokeGrad.setAttribute('x2', '0%');
        strokeGrad.setAttribute('y2', '100%');
        const strokeStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        strokeStop1.setAttribute('offset', '0%');
        strokeStop1.setAttribute('stop-color', 'black');
        strokeGrad.appendChild(strokeStop1);
        const strokeStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        strokeStop2.setAttribute('offset', '100%');
        strokeStop2.setAttribute('stop-color', lightenColor('#000000', 20));
        strokeGrad.appendChild(strokeStop2);
        defs.appendChild(strokeGrad);

        svg.appendChild(defs);

        const radius = 50;
        const cx = 50;
        const cy = 50;
        segments.forEach((segment, index) => {
            const segmentAngle = (segment.weight / totalWeight) * 360;
            // Un arc SVG ne peut pas boucler exactement à 360° (point de
            // départ = point d'arrivée = tracé dégénéré, invisible) : cas
            // réel dès qu'il ne reste qu'un seul segment sur la roue.
            const arcSweep = segmentAngle >= 359.99 ? 359.99 : segmentAngle;
            const startRad = (currentAngle * Math.PI / 180);
            const endRad = ((currentAngle + arcSweep) * Math.PI / 180);

            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);

            const largeArc = (segmentAngle > 180) ? 1 : 0;
            const depleted = isDepleted(segment);

            const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD);
            path.setAttribute('fill', depleted ? '#9a9a9a' : `url(#grad${index})`);
            path.setAttribute('opacity', depleted ? '0.4' : '1');
            path.setAttribute('stroke', 'url(#strokeGrad)');
            path.setAttribute('stroke-width', '0.5');
            path.setAttribute('pointer-events', 'none');
            path.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
            svg.appendChild(path);

            const segmentColor = colors[index % colors.length];
            const labelAngle = currentAngle + segmentAngle / 2;
            const textColor = readableTextColor(segmentColor);
            const textShadow = textColor === '#ffffff' ? '1px 1px 2px rgba(0,0,0,0.5)' : '1px 1px 2px rgba(255,255,255,0.4)';
            const iconSvg = segment.imageUrl
                ? `<img src="${segment.imageUrl}" alt="" style="width:3.4vmin;height:3.4vmin;object-fit:contain;display:block;margin:0 auto 2px;">`
                : window.IconLibrary.renderSVG(segment.iconId, { size: 0 }).replace('<svg ', '<svg style="width:3.4vmin;height:3.4vmin;display:block;margin:0 auto 2px;color:' + textColor + ';" ');
            const depletedTag = depleted ? '<span class="depleted-tag">Épuisé</span>' : '';
            labelHtml += `
                <div class="label${depleted ? ' depleted' : ''}" style="
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 16vmin;
                    transform: translate(-50%, -50%) rotate(${labelAngle}deg) translateY(-35vmin);
                    text-align: center;
                    color: ${textColor};
                    font-weight: bold;
                    font-size: 2vmin;
                    text-shadow: ${textShadow};
                    white-space: nowrap;
                    overflow: hidden;
                    pointer-events: none;
                    z-index: 1;
                ">${iconSvg}${segment.description}${depletedTag}</div>
            `;

            segment.segmentRange = [currentAngle, currentAngle + segmentAngle];
            currentAngle += segmentAngle;
        });

        wheel.appendChild(svg);
        wheel.insertAdjacentHTML('beforeend', labelHtml);
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

    // Suit la rotation réelle de la roue pendant l'animation pour jouer un
    // "tick" (son + rebond du pointeur) à chaque frontière de segment
    // franchie — indépendant de la courbe d'accélération CSS.
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
                        void pointerEl.offsetWidth; // force le reflow pour rejouer l'animation CSS
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
            resultDiv.textContent = 'Tous les lots sont épuisés.';
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

        const handler = () => finishSpin(winner);
        wheel.addEventListener('transitionend', handler, { once: true });
    }

    function finishSpin(winner) {
        resultDiv.textContent = `Résultat : ${winner.description} !`;

        if (winner.stock !== null && winner.stock !== undefined) {
            winner.stock = Math.max(0, winner.stock - 1);
            if (loadedConfig) window.ConfigStore.saveConfig(loadedConfig);
            generateWheel();
        }

        showGiftImage(winner);

        if (settings.confettiEnabled !== false) triggerConfetti();
        if (settings.soundEnabled !== false) window.SoundFX.play('win');

        isSpinning = false;
        spinButton.disabled = false;
        resetIdleTimer();
    }

    function triggerConfetti() {
        const count = 100;
        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            const size = Math.random() * 8 + 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            piece.style.cssText = `
                position: fixed; left: 50%; top: 40%;
                width: ${size}px; height: ${size}px; background: ${color};
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                pointer-events: none; z-index: 10000;
            `;
            document.body.appendChild(piece);

            const anim = piece.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                { transform: `translate(${Math.random() * 200 - 100}vw, ${Math.random() * 140 - 30}vh) rotate(${Math.random() * 720}deg) scale(1)`, opacity: 0.9, offset: 0.7 },
                { transform: `translate(${Math.random() * 220 - 110}vw, ${Math.random() * 160}vh) rotate(${Math.random() * 1080}deg) scale(1)`, opacity: 0 }
            ], {
                duration: 1600 + Math.random() * 1200,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            anim.onfinish = () => piece.remove();
        }
    }

    function showGiftImage(gift) {
        const overlay = document.createElement('div');
        overlay.id = 'gift-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.8); display: flex; flex-direction: column;
            gap: 20px; justify-content: center; align-items: center; z-index: 9999; opacity: 0;
            transition: opacity 0.5s ease-in-out;
        `;

        const visual = document.createElement('div');
        visual.style.cssText = `
            width: min(50vmin, 320px); height: min(50vmin, 320px); border-radius: 50%;
            background: ${accentColor}; display: flex; justify-content: center; align-items: center;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4); opacity: 0;
            transform: scale(0.8); transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
        `;

        if (gift.imageUrl) {
            const img = document.createElement('img');
            img.src = gift.imageUrl;
            img.alt = gift.description;
            img.style.cssText = 'max-width: 70%; max-height: 70%; object-fit: contain;';
            visual.appendChild(img);
        } else {
            visual.innerHTML = window.IconLibrary.renderSVG(gift.iconId, { size: 0 })
                .replace('<svg ', '<svg style="width:55%;height:55%;color:#ffffff;" ');
        }

        const label = document.createElement('div');
        label.textContent = gift.description;
        label.style.cssText = 'color:white; font-size: 28px; font-weight: bold; text-align:center; opacity:0; transition: opacity 0.5s ease-in-out;';

        overlay.appendChild(visual);
        overlay.appendChild(label);
        document.body.appendChild(overlay);

        const displayMs = settings.resultDisplayMs || 3000;

        setTimeout(() => { overlay.style.opacity = '1'; }, 10);
        setTimeout(() => {
            visual.style.opacity = '1';
            visual.style.transform = 'scale(1)';
            label.style.opacity = '1';
        }, 250);
        setTimeout(() => {
            visual.style.opacity = '0';
            visual.style.transform = 'scale(0.8)';
            label.style.opacity = '0';
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 500);
            }, 250);
        }, displayMs);
    }

    // Mode attraction : après une période d'inactivité, fait légèrement
    // pulser le bouton pour inciter les passants d'un salon à jouer.
    function resetIdleTimer() {
        spinButton.classList.remove('attract');
        if (idleTimer) clearTimeout(idleTimer);
        if (settings.attractModeEnabled === false) return;
        const seconds = settings.attractIdleSeconds || 45;
        idleTimer = setTimeout(() => {
            if (!isSpinning) spinButton.classList.add('attract');
        }, seconds * 1000);
    }

    async function init() {
        const config = await window.ConfigStore.loadConfig();
        loadedConfig = config;
        settings = config.settings;
        segments = config.segments;

        const theme = window.ThemeLibrary.resolve(settings);
        colors = theme.colors;
        accentColor = theme.accentColor;

        if (titleEl) {
            titleEl.textContent = settings.title || 'Roue de la Fortune';
            document.title = settings.title || 'Roue de la Fortune';
        }

        document.documentElement.style.setProperty('--accent-color', accentColor);
        document.documentElement.style.setProperty('--accent-color-dark', shadeColor(accentColor, -25));
        document.documentElement.style.setProperty('--overlay-color', darkestColor(colors));
        document.documentElement.style.setProperty('--title-color', accentColor);

        // Quand la config vient du localStorage (pas de config.json à
        // récupérer), cette résolution se termine si vite qu'elle peut
        // arriver avant que background.js ait fini de charger et d'écouter
        // l'évènement ci-dessous. On expose donc aussi le résultat sur
        // window, que background.js consulte directement à son chargement.
        window.__wheelTheme = { colors, accentColor };
        window.dispatchEvent(new CustomEvent('wheel:theme-ready', { detail: { colors, accentColor } }));

        generateWheel();
        resetIdleTimer();
    }

    spinButton.addEventListener('click', spin);

    ['click', 'mousemove', 'keydown', 'touchstart'].forEach((evt) => {
        window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    // Si la config est modifiée dans un autre onglet (admin.html), on
    // régénère la roue pour refléter le changement immédiatement.
    window.addEventListener('storage', (event) => {
        if (event.key === window.ConfigStore.STORAGE_KEY && !isSpinning) {
            init();
        }
    });

    init();
})();
