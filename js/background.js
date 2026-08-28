// Décor animé (formes géométriques + particules) — cosmétique, mais coloré
// selon le thème actif (au lieu de couleurs fixes), pour rester cohérent
// avec le reste de l'interface. wheel.js diffuse l'évènement
// "wheel:theme-ready" dès que le thème est résolu ; l'ordre d'arrivée entre
// cet évènement et DOMContentLoaded n'est pas garanti, donc on gère les deux
// cas : recolorer après coup, ou créer directement avec la bonne palette.
(function () {
    // Si wheel.js a déjà résolu le thème avant que ce script ne s'exécute
    // (arrive quand la config vient du localStorage, sans latence réseau),
    // on part directement de sa palette plutôt que du secours ci-dessous.
    let themeColors = (window.__wheelTheme && window.__wheelTheme.colors) || ['#ee3126', '#4a4a4a', '#d0b580', '#2e3440'];

    function pickColor(index) {
        return themeColors[index % themeColors.length];
    }

    function applyShapeColor(shape, index) {
        const color = pickColor(index);
        if (shape.classList.contains('triangle')) {
            shape.style.borderBottomColor = color;
        } else {
            shape.style.background = color;
        }
    }

    function createShapes() {
        const background = document.getElementById('geometric-background');
        if (!background) return;
        const shapeTypes = ['square', 'circle', 'triangle', 'rectangle'];

        for (let i = 0; i < 40; i++) {
            const shape = document.createElement('div');
            const shapeClass = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
            shape.className = `shape ${shapeClass}`;
            shape.dataset.colorIndex = String(i);
            applyShapeColor(shape, i);

            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const delay = Math.random() * 10;
            const duration = Math.random() * 10 + 10;

            shape.style.left = `${posX}%`;
            shape.style.top = `${posY}%`;
            shape.style.animationDelay = `${delay}s`;
            shape.style.animationDuration = `${duration}s`;

            background.appendChild(shape);
        }
    }

    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        for (let i = 0; i < 100; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.dataset.colorIndex = String(i);
            particle.style.backgroundColor = pickColor(i);

            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const delay = Math.random() * 8;
            const duration = Math.random() * 4 + 4;

            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;

            particlesContainer.appendChild(particle);
        }
    }

    function recolorExisting() {
        document.querySelectorAll('.shape').forEach((shape) => {
            applyShapeColor(shape, Number(shape.dataset.colorIndex || 0));
        });
        document.querySelectorAll('.particle').forEach((particle) => {
            particle.style.backgroundColor = pickColor(Number(particle.dataset.colorIndex || 0));
        });
    }

    function addMouseInteraction() {
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            const shapes = document.querySelectorAll('.shape');
            shapes.forEach(shape => {
                const speed = 0.05;
                const shapeX = parseFloat(shape.style.left);
                const shapeY = parseFloat(shape.style.top);

                shape.style.left = `${shapeX + (x - 0.5) * speed}%`;
                shape.style.top = `${shapeY + (y - 0.5) * speed}%`;
            });
        });
    }

    window.addEventListener('wheel:theme-ready', (event) => {
        if (event.detail && Array.isArray(event.detail.colors) && event.detail.colors.length) {
            themeColors = event.detail.colors;
        }
        recolorExisting();
    });

    document.addEventListener('DOMContentLoaded', () => {
        createShapes();
        createParticles();
        addMouseInteraction();
    });
})();
