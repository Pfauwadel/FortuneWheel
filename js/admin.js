(function () {
    const CS = window.ConfigStore;

    let currentConfig = null;

    const el = {
        title: document.getElementById('setting-title'),
        minTurns: document.getElementById('setting-min-turns'),
        maxTurns: document.getElementById('setting-max-turns'),
        displayMs: document.getElementById('setting-display-ms'),
        paletteList: document.getElementById('palette-list'),
        addColor: document.getElementById('add-color'),
        segmentsBody: document.getElementById('segments-body'),
        addSegment: document.getElementById('add-segment'),
        saveBtn: document.getElementById('save-btn'),
        exportBtn: document.getElementById('export-btn'),
        importInput: document.getElementById('import-input'),
        resetBtn: document.getElementById('reset-btn'),
        previewFrame: document.getElementById('preview-frame'),
        refreshPreview: document.getElementById('refresh-preview'),
        statusBanner: document.getElementById('status-banner')
    };

    function showStatus(message, type) {
        el.statusBanner.textContent = message;
        el.statusBanner.className = `show ${type}`;
        setTimeout(() => { el.statusBanner.className = ''; }, 3000);
    }

    function readFormIntoConfig() {
        currentConfig.settings.title = el.title.value.trim() || 'Roue de la Fortune';
        currentConfig.settings.spinMinTurns = Number(el.minTurns.value) || 5;
        currentConfig.settings.spinMaxTurns = Math.max(
            currentConfig.settings.spinMinTurns,
            Number(el.maxTurns.value) || 10
        );
        currentConfig.settings.resultDisplayMs = Number(el.displayMs.value) || 3000;

        currentConfig.settings.colors = Array.from(
            el.paletteList.querySelectorAll('input[type="color"]')
        ).map((input) => input.value);

        const rows = Array.from(el.segmentsBody.querySelectorAll('tr'));
        currentConfig.segments = rows.map((row) => ({
            id: row.dataset.id,
            description: row.querySelector('.segment-description').value.trim() || 'Lot',
            weight: Number(row.querySelector('.segment-weight').value) || 1,
            imageUrl: row.dataset.imageUrl || ''
        }));
    }

    function renderPalette() {
        el.paletteList.innerHTML = '';
        currentConfig.settings.colors.forEach((color, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'field';
            wrapper.innerHTML = `
                <label>Couleur ${index + 1}</label>
                <div style="display:flex; gap:4px; align-items:center;">
                    <input type="color" value="${color}">
                    <button type="button" class="btn btn-icon remove-color" title="Supprimer">✕</button>
                </div>
            `;
            wrapper.querySelector('.remove-color').addEventListener('click', () => {
                if (currentConfig.settings.colors.length <= 1) {
                    showStatus('Il faut garder au moins une couleur.', 'error');
                    return;
                }
                currentConfig.settings.colors.splice(index, 1);
                renderPalette();
            });
            el.paletteList.appendChild(wrapper);
        });
    }

    function renderSegmentRow(segment) {
        const row = document.createElement('tr');
        row.dataset.id = segment.id;
        row.dataset.imageUrl = segment.imageUrl || '';

        row.innerHTML = `
            <td>
                <img class="thumb" src="${segment.imageUrl || ''}" alt="">
                <input type="file" accept="image/*" class="segment-image-input" style="display:none;">
            </td>
            <td><input type="text" class="segment-description" value="${segment.description}"></td>
            <td><input type="number" class="segment-weight" min="1" step="1" value="${segment.weight}"></td>
            <td>
                <button type="button" class="btn btn-icon segment-upload" title="Changer l'image">📷</button>
                <button type="button" class="btn btn-icon btn-danger segment-remove" title="Supprimer">🗑</button>
            </td>
        `;

        const thumb = row.querySelector('.thumb');
        const fileInput = row.querySelector('.segment-image-input');

        row.querySelector('.segment-upload').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;
            try {
                const dataUrl = await CS.resizeImageFile(file);
                row.dataset.imageUrl = dataUrl;
                thumb.src = dataUrl;
            } catch (err) {
                showStatus('Image illisible : ' + err.message, 'error');
            }
        });

        row.querySelector('.segment-remove').addEventListener('click', () => {
            row.remove();
        });

        el.segmentsBody.appendChild(row);
    }

    function renderSegments() {
        el.segmentsBody.innerHTML = '';
        currentConfig.segments.forEach(renderSegmentRow);
    }

    function renderAll() {
        el.title.value = currentConfig.settings.title;
        el.minTurns.value = currentConfig.settings.spinMinTurns;
        el.maxTurns.value = currentConfig.settings.spinMaxTurns;
        el.displayMs.value = currentConfig.settings.resultDisplayMs;
        renderPalette();
        renderSegments();
    }

    function refreshPreview() {
        el.previewFrame.src = 'wheel.html?t=' + Date.now();
    }

    async function saveConfig() {
        readFormIntoConfig();
        CS.saveConfig(currentConfig);
        showStatus('Configuration enregistrée sur ce poste.', 'success');
        refreshPreview();
    }

    async function init() {
        currentConfig = await CS.loadConfig();
        renderAll();

        el.addColor.addEventListener('click', () => {
            currentConfig.settings.colors.push('#888888');
            renderPalette();
        });

        el.addSegment.addEventListener('click', () => {
            renderSegmentRow({
                id: 'seg-' + Date.now(),
                description: 'Nouveau lot',
                imageUrl: '',
                weight: 100
            });
        });

        el.saveBtn.addEventListener('click', saveConfig);

        el.exportBtn.addEventListener('click', () => {
            readFormIntoConfig();
            CS.exportConfigFile(currentConfig);
        });

        el.importInput.addEventListener('change', async () => {
            const file = el.importInput.files[0];
            if (!file) return;
            try {
                currentConfig = await CS.importConfigFile(file);
                renderAll();
                showStatus('Fichier importé. Cliquez sur "Enregistrer" pour l\'appliquer sur ce poste.', 'success');
            } catch (err) {
                showStatus('Import impossible : ' + err.message, 'error');
            }
            el.importInput.value = '';
        });

        el.resetBtn.addEventListener('click', async () => {
            if (!confirm('Réinitialiser la configuration de ce poste à la valeur par défaut du dépôt ?')) return;
            CS.clearLocalOverride();
            currentConfig = await CS.loadConfig();
            renderAll();
            showStatus('Configuration réinitialisée.', 'success');
            refreshPreview();
        });

        el.refreshPreview.addEventListener('click', refreshPreview);
    }

    init();
})();
