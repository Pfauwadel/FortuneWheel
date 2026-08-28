(function () {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin');
    const resultDiv = document.getElementById('result');
    const titleEl = document.getElementById('wheel-title');

    let segments = [];
    let colors = [];
    let settings = {};
    let isSpinning = false;

    function lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (Math.min(255, R) << 16) + (Math.min(255, G) << 8) + Math.min(255, B)).toString(16).slice(1);
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
            const startRad = (currentAngle * Math.PI / 180);
            const endRad = ((currentAngle + segmentAngle) * Math.PI / 180);

            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);

            const largeArc = (segmentAngle > 180) ? 1 : 0;

            const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD);
            path.setAttribute('fill', `url(#grad${index})`);
            path.setAttribute('stroke', 'url(#strokeGrad)');
            path.setAttribute('stroke-width', '0.5');
            path.setAttribute('pointer-events', 'none');
            path.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
            svg.appendChild(path);

            const labelAngle = currentAngle + segmentAngle / 2;
            labelHtml += `
                <div class="label" style="
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 16vmin;
                    transform: translate(-50%, -50%) rotate(${labelAngle}deg) translateY(-35vmin);
                    text-align: center;
                    color: white;
                    font-weight: bold;
                    font-size: 2vmin;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    white-space: nowrap;
                    overflow: hidden;
                    pointer-events: none;
                    z-index: 1;
                ">${segment.description}</div>
            `;

            segment.segmentRange = [currentAngle, currentAngle + segmentAngle];
            currentAngle += segmentAngle;
        });

        wheel.appendChild(svg);
        wheel.insertAdjacentHTML('beforeend', labelHtml);
    }

    function findGiftByAngle(angle) {
        angle = ((angle % 360) + 360) % 360;
        for (let i = 0; i < segments.length; i++) {
            const [start, end] = segments[i].segmentRange;
            if (angle >= start && angle < end) {
                return segments[i];
            }
        }
        return null;
    }

    function spin() {
        if (isSpinning) return;

        isSpinning = true;
        spinButton.disabled = true;
        resultDiv.textContent = '';

        const minTurns = settings.spinMinTurns || 5;
        const maxTurns = settings.spinMaxTurns || 10;
        const numSpins = minTurns + Math.random() * (maxTurns - minTurns);
        const extraAngle = Math.random() * 360;
        const totalRotation = numSpins * 360 + extraAngle;

        wheel.style.transform = `rotate(${totalRotation}deg)`;

        const handler = () => {
            const finalStyle = window.getComputedStyle(wheel);
            const matrixStr = finalStyle.transform;
            if (matrixStr === 'none') {
                isSpinning = false;
                spinButton.disabled = false;
                return;
            }
            const values = matrixStr.split('matrix(')[1].split(')')[0].split(',').map(parseFloat);
            const a = values[0];
            const b = values[1];
            const angleRad = Math.atan2(b, a);
            let angle = 360 - (angleRad * (180 / Math.PI));
            if (angle < 0) angle += 360;
            const selectedGift = findGiftByAngle(angle);
            if (selectedGift) {
                resultDiv.textContent = `Résultat : ${selectedGift.description} !`;
                showGiftImage(selectedGift);
            }
            isSpinning = false;
            spinButton.disabled = false;
        };
        wheel.addEventListener('transitionend', handler, { once: true });
    }

    function showGiftImage(gift) {
        if (!gift.imageUrl) return;
        const overlay = document.createElement('div');
        overlay.id = 'gift-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center;
            align-items: center; z-index: 9999; opacity: 0;
            transition: opacity 0.5s ease-in-out;
        `;

        const img = document.createElement('img');
        img.src = gift.imageUrl;
        img.alt = gift.description;
        img.style.cssText = `
            max-width: 80vw; max-height: 80vh; border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); opacity: 0;
            transform: scale(0.8); transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
        `;

        overlay.appendChild(img);
        document.body.appendChild(overlay);

        const displayMs = settings.resultDisplayMs || 3000;

        setTimeout(() => { overlay.style.opacity = '1'; }, 10);
        setTimeout(() => {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
        }, 250);
        setTimeout(() => {
            img.style.opacity = '0';
            img.style.transform = 'scale(0.8)';
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 500);
            }, 250);
        }, displayMs);
    }

    async function init() {
        const config = await window.ConfigStore.loadConfig();
        settings = config.settings;
        segments = config.segments;
        colors = settings.colors && settings.colors.length ? settings.colors : ['#ee3126', '#4a4a4a', '#d0b580'];

        if (titleEl) {
            titleEl.textContent = settings.title || 'Roue de la Fortune';
            document.title = settings.title || 'Roue de la Fortune';
        }

        generateWheel();
    }

    spinButton.addEventListener('click', spin);

    // Si la config est modifiée dans un autre onglet (admin.html), on
    // régénère la roue pour refléter le changement immédiatement.
    window.addEventListener('storage', (event) => {
        if (event.key === window.ConfigStore.STORAGE_KEY && !isSpinning) {
            init();
        }
    });

    init();
})();
