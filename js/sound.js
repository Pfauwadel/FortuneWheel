// Effets sonores synthétisés via Web Audio (aucun fichier audio à charger).
// Silencieux si l'API est indisponible/bloquée (politique d'autoplay) : on
// avale simplement l'erreur, le jeu reste jouable sans son.
(function () {
    let ctx = null;

    function getCtx() {
        if (!ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            ctx = new AudioCtx();
        }
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    function tone(freq, duration, type, gainPeak, startDelay) {
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(c.destination);

        const t0 = c.currentTime + (startDelay || 0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        osc.start(t0);
        osc.stop(t0 + duration + 0.05);
    }

    function play(name) {
        try {
            if (name === 'tick') {
                tone(900, 0.05, 'square', 0.12, 0);
            } else if (name === 'spin') {
                tone(220, 0.4, 'sawtooth', 0.08, 0);
            } else if (name === 'win') {
                tone(523.25, 0.15, 'triangle', 0.2, 0);
                tone(659.25, 0.15, 'triangle', 0.2, 0.12);
                tone(783.99, 0.3, 'triangle', 0.22, 0.24);
            }
        } catch (err) {
            // Web Audio indisponible ou bloqué par le navigateur : on ignore.
        }
    }

    window.SoundFX = { play };
})();
