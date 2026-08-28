// Décor animé (formes géométriques + particules) — purement cosmétique.
function createShapes() {
    const background = document.getElementById('geometric-background');
    if (!background) return;
    const shapeTypes = ['square', 'circle', 'triangle', 'rectangle'];

    for (let i = 0; i < 40; i++) {
        const shape = document.createElement('div');
        const shapeClass = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        shape.className = `shape ${shapeClass}`;

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

document.addEventListener('DOMContentLoaded', () => {
    createShapes();
    createParticles();
    addMouseInteraction();
});
