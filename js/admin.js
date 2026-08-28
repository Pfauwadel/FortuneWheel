(function () {
    const CS = window.ConfigStore;
    const IL = window.IconLibrary;
    const TL = window.ThemeLibrary;

    let currentConfig = null;

    const el = {
        title: document.getElementById('setting-title'),
        hubText: document.getElementById('setting-hub-text'),
        minTurns: document.getElementById('setting-min-turns'),
        maxTurns: document.getElementById('setting-max-turns'),
        displayMs: document.getElementById('setting-display-ms'),
        confetti: document.getElementById('setting-confetti'),
        sound: document.getElementById('setting-sound'),
        attract: document.getElementById('setting-attract'),
        attractSeconds: document.getElementById('setting-attract-seconds'),
        themeGrid: document.getElementById('theme-grid'),
        brandColorInput: document.getElementById('brand-color-input'),
        generateThemeBtn: document.getElementById('generate-theme-btn'),
        applyThemeBtn: document.getElementById('apply-theme-btn'),
        customPaletteSection: document.getElementById('custom-palette-section'),
        customPaletteHint: document.getElementById('custom-palette-hint'),
        paletteList: document.getElementById('palette-list'),
        addColor: document.getElementById('add-color'),
        iconGallery: document.getElementById('icon-gallery'),
        segmentsBody: document.getElementById('segments-body'),
        addBlankSegment: document.getElementById('add-blank-segment'),
        resetStocksBtn: document.getElementById('reset-stocks-btn'),
        saveBtn: document.getElementById('save-btn'),
        exportBtn: document.getElementById('export-btn'),
        importInput: document.getElementById('import-input'),
        resetBtn: document.getElementById('reset-btn'),
        previewFrame: document.getElementById('preview-frame'),
        refreshPreview: document.getElementById('refresh-preview'),
        statusBanner: document.getElementById('status-banner'),
        pinStatus: document.getElementById('pin-status'),
        pinNew: document.getElementById('pin-new'),
        pinConfirm: document.getElementById('pin-confirm'),
        pinSetBtn: document.getElementById('pin-set-btn'),
        pinRemoveBtn: document.getElementById('pin-remove-btn')
    };

    function showStatus(message, type) {
        el.statusBanner.textContent = message;
        el.statusBanner.className = `show ${type}`;
        setTimeout(() => { el.statusBanner.className = ''; }, 3000);
    }

    // --- Sélecteur d'icône réutilisable (modal) ---------------------------
    function openIconPicker(onSelect) {
        const overlay = document.createElement('div');
        overlay.className = 'icon-picker-overlay';
        overlay.innerHTML = `
            <div class="icon-picker-panel">
                <h3>Choisir un goodie</h3>
                <div class="icon-grid" id="icon-picker-grid"></div>
                <div class="toolbar">
                    <button class="btn" id="icon-picker-cancel">Annuler</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const grid = overlay.querySelector('#icon-picker-grid');
        IL.list.forEach((icon) => {
            const card = document.createElement('div');
            card.className = 'icon-card';
            card.innerHTML = `${IL.renderSVG(icon.id)}<span>${icon.label}</span>`;
            card.addEventListener('click', () => {
                onSelect(icon);
                overlay.remove();
            });
            grid.appendChild(card);
        });

        overlay.querySelector('#icon-picker-cancel').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    // --- Thème --------------------------------------------------------------
    function renderThemeGrid() {
        el.themeGrid.innerHTML = '';
        const currentThemeId = currentConfig.settings.themeId || 'kuhn';

        TL.list.forEach((theme) => {
            const card = document.createElement('div');
            card.className = 'theme-card' + (currentThemeId === theme.id ? ' selected' : '');
            card.innerHTML = `
                <div class="swatches">${theme.colors.map((c) => `<span style="background:${c}"></span>`).join('')}</div>
                <div class="theme-name">${theme.label}</div>
            `;
            card.addEventListener('click', () => {
                currentConfig.settings.themeId = theme.id;
                renderThemeGrid();
                el.customPaletteSection.style.display = 'none';
                el.customPaletteHint.style.display = 'none';
                schedulePreviewUpdate();
            });
            el.themeGrid.appendChild(card);
        });

        const customCard = document.createElement('div');
        customCard.className = 'theme-card' + (currentThemeId === 'custom' ? ' selected' : '');
        customCard.innerHTML = `
            <div class="swatches"><span style="background:linear-gradient(90deg,#ee3126,#4a4a4a,#d0b580,#2e3440)"></span></div>
            <div class="theme-name">Personnalisé</div>
        `;
        customCard.addEventListener('click', () => {
            currentConfig.settings.themeId = 'custom';
            if (!currentConfig.settings.colors || !currentConfig.settings.colors.length) {
                currentConfig.settings.colors = TL.get('kuhn').colors.slice();
            }
            if (!currentConfig.settings.accentColor) {
                currentConfig.settings.accentColor = TL.get('kuhn').accentColor;
            }
            renderThemeGrid();
            renderPalette();
            el.customPaletteSection.style.display = '';
            el.customPaletteHint.style.display = '';
            schedulePreviewUpdate();
        });
        el.themeGrid.appendChild(customCard);

        const isCustom = currentThemeId === 'custom';
        el.customPaletteSection.style.display = isCustom ? '' : 'none';
        el.customPaletteHint.style.display = isCustom ? '' : 'none';
    }

    function renderPalette() {
        el.paletteList.innerHTML = '';
        const colors = currentConfig.settings.colors || [];
        colors.forEach((color, index) => {
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
                if (colors.length <= 1) {
                    showStatus('Il faut garder au moins une couleur.', 'error');
                    return;
                }
                colors.splice(index, 1);
                renderPalette();
                schedulePreviewUpdate();
            });
            el.paletteList.appendChild(wrapper);
        });
    }

    // --- Bibliothèque de goodies ---------------------------------------------
    function renderIconGallery() {
        el.iconGallery.innerHTML = '';
        IL.list.forEach((icon) => {
            const card = document.createElement('div');
            card.className = 'icon-card';
            card.innerHTML = `${IL.renderSVG(icon.id)}<span>${icon.label}</span>`;
            card.addEventListener('click', () => {
                renderSegmentRow({
                    id: 'seg-' + Date.now() + '-' + Math.round(Math.random() * 999),
                    description: icon.label,
                    iconId: icon.id,
                    imageUrl: '',
                    weight: 100
                });
                showStatus(`« ${icon.label} » ajouté aux segments.`, 'success');
                schedulePreviewUpdate();
            });
            el.iconGallery.appendChild(card);
        });
    }

    // --- Segments -------------------------------------------------------------
    function segmentThumbHTML(segment) {
        return segment.imageUrl
            ? `<img src="${segment.imageUrl}" alt="">`
            : IL.renderSVG(segment.iconId || 'mystery');
    }

    function renderSegmentRow(segment) {
        const row = document.createElement('tr');
        row.dataset.id = segment.id;
        row.dataset.iconId = segment.iconId || 'mystery';
        row.dataset.imageUrl = segment.imageUrl || '';
        // Le stock "restant" (contrairement au stock initial) n'est jamais
        // modifié par ce formulaire : il ne bouge qu'en jouant sur la roue,
        // ou via "Réinitialiser les stocks" — sinon un Enregistrer ferait
        // régresser un stock déjà entamé en cours d'évènement.
        row.dataset.stock = segment.stock === null || segment.stock === undefined ? '' : String(segment.stock);

        const initialStock = segment.initialStock === null || segment.initialStock === undefined ? '' : segment.initialStock;
        const remainingLabel = segment.initialStock === null || segment.initialStock === undefined
            ? ''
            : `<span class="stock-remaining">Restant : ${segment.stock ?? segment.initialStock}</span>`;

        row.innerHTML = `
            <td>
                <div class="thumb" title="Changer l'icône">${segmentThumbHTML(segment)}</div>
                <input type="file" accept="image/*" class="segment-image-input" style="display:none;">
            </td>
            <td><input type="text" class="segment-description" value="${segment.description}"></td>
            <td><input type="number" class="segment-weight" min="1" step="1" value="${segment.weight}"></td>
            <td>
                <input type="number" class="segment-stock" min="0" step="1" placeholder="Illimité" value="${initialStock}">
                ${remainingLabel}
            </td>
            <td>
                <button type="button" class="btn btn-icon segment-upload" title="Image personnalisée">📷</button>
                <button type="button" class="btn btn-icon btn-danger segment-remove" title="Supprimer">🗑</button>
            </td>
        `;

        const thumb = row.querySelector('.thumb');
        const fileInput = row.querySelector('.segment-image-input');

        thumb.addEventListener('click', () => {
            openIconPicker((icon) => {
                row.dataset.iconId = icon.id;
                row.dataset.imageUrl = '';
                thumb.innerHTML = IL.renderSVG(icon.id);
                schedulePreviewUpdate();
            });
        });

        row.querySelector('.segment-upload').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;
            try {
                const dataUrl = await CS.resizeImageFile(file);
                row.dataset.imageUrl = dataUrl;
                thumb.innerHTML = `<img src="${dataUrl}" alt="">`;
                schedulePreviewUpdate();
            } catch (err) {
                showStatus('Image illisible : ' + err.message, 'error');
            }
        });

        row.querySelector('.segment-remove').addEventListener('click', () => {
            row.remove();
            schedulePreviewUpdate();
        });

        el.segmentsBody.appendChild(row);
    }

    function renderSegments() {
        el.segmentsBody.innerHTML = '';
        currentConfig.segments.forEach(renderSegmentRow);
    }

    function renderAll() {
        el.title.value = currentConfig.settings.title;
        el.hubText.value = currentConfig.settings.hubText;
        el.minTurns.value = currentConfig.settings.spinMinTurns;
        el.maxTurns.value = currentConfig.settings.spinMaxTurns;
        el.displayMs.value = currentConfig.settings.resultDisplayMs;
        el.confetti.checked = currentConfig.settings.confettiEnabled !== false;
        el.sound.checked = currentConfig.settings.soundEnabled !== false;
        el.attract.checked = currentConfig.settings.attractModeEnabled !== false;
        el.attractSeconds.value = currentConfig.settings.attractIdleSeconds || 45;
        const toneMode = currentConfig.settings.wheelToneMode === 'palette' ? 'palette' : 'duo';
        const toneRadio = document.getElementById('setting-tone-' + toneMode);
        if (toneRadio) toneRadio.checked = true;
        renderThemeGrid();
        renderPalette();
        renderSegments();
        renderPinStatus();
    }

    function renderPinStatus() {
        el.pinStatus.textContent = window.AdminLock.hasPin()
            ? 'PIN activé sur ce poste.'
            : 'Aucun PIN défini — l\'administration est accessible sans code.';
    }

    function readFormIntoConfig() {
        currentConfig.settings.title = el.title.value.trim() || 'Roue de la Fortune';
        currentConfig.settings.hubText = el.hubText.value.trim() || 'KUHN';
        currentConfig.settings.spinMinTurns = Number(el.minTurns.value) || 5;
        currentConfig.settings.spinMaxTurns = Math.max(
            currentConfig.settings.spinMinTurns,
            Number(el.maxTurns.value) || 10
        );
        currentConfig.settings.resultDisplayMs = Number(el.displayMs.value) || 3000;
        currentConfig.settings.confettiEnabled = el.confetti.checked;
        currentConfig.settings.soundEnabled = el.sound.checked;
        currentConfig.settings.attractModeEnabled = el.attract.checked;
        currentConfig.settings.attractIdleSeconds = Number(el.attractSeconds.value) || 45;
        const toneInput = document.querySelector('input[name="wheel-tone"]:checked');
        currentConfig.settings.wheelToneMode = toneInput ? toneInput.value : 'duo';

        if (currentConfig.settings.themeId === 'custom') {
            currentConfig.settings.colors = Array.from(
                el.paletteList.querySelectorAll('input[type="color"]')
            ).map((input) => input.value);
            currentConfig.settings.accentColor = currentConfig.settings.colors[0] || '#ee3126';
        }

        const rows = Array.from(el.segmentsBody.querySelectorAll('tr'));
        currentConfig.segments = rows.map((row) => {
            const stockInput = row.querySelector('.segment-stock').value;
            const initialStock = stockInput === '' ? null : Math.max(0, Number(stockInput));
            const preservedStock = row.dataset.stock === '' ? null : Number(row.dataset.stock);
            return {
                id: row.dataset.id,
                description: row.querySelector('.segment-description').value.trim() || 'Lot',
                weight: Number(row.querySelector('.segment-weight').value) || 1,
                iconId: row.dataset.iconId || 'mystery',
                imageUrl: row.dataset.imageUrl || '',
                initialStock,
                // Le stock restant vient de ce qui était déjà en mémoire (mis
                // à jour par la roue elle-même) ; s'il n'existait pas encore
                // (nouveau segment), il démarre au stock initial saisi.
                stock: preservedStock !== null ? preservedStock : initialStock
            };
        });
    }

    function refreshPreview() {
        el.previewFrame.src = 'wheel.html?t=' + Date.now();
    }

    // Aperçu en direct : envoie le brouillon en cours (pas encore enregistré)
    // à la roue affichée dans l'iframe, qui l'affiche sans jamais l'écrire
    // en localStorage. Débouncé pour ne pas spammer pendant la frappe.
    let previewDebounce = null;
    function schedulePreviewUpdate() {
        if (previewDebounce) clearTimeout(previewDebounce);
        previewDebounce = setTimeout(pushPreview, 250);
    }

    function pushPreview() {
        readFormIntoConfig();
        const frameWindow = el.previewFrame.contentWindow;
        if (!frameWindow) return;
        frameWindow.postMessage({ type: 'wheel:preview-config', config: currentConfig }, window.location.origin);
    }

    async function saveConfig(message) {
        readFormIntoConfig();
        CS.saveConfig(currentConfig);
        showStatus(message || 'Configuration enregistrée sur ce poste.', 'success');
        refreshPreview();
    }

    async function init() {
        currentConfig = await CS.loadConfig();
        renderAll();

        el.addColor.addEventListener('click', () => {
            currentConfig.settings.colors.push('#888888');
            renderPalette();
            schedulePreviewUpdate();
        });

        el.addBlankSegment.addEventListener('click', () => {
            renderSegmentRow({
                id: 'seg-' + Date.now(),
                description: 'Nouveau lot',
                iconId: 'mystery',
                imageUrl: '',
                weight: 100
            });
            schedulePreviewUpdate();
        });

        el.resetStocksBtn.addEventListener('click', () => {
            readFormIntoConfig();
            window.ConfigStore.resetStocks(currentConfig);
            CS.saveConfig(currentConfig);
            renderSegments();
            showStatus('Stocks réinitialisés à leur valeur initiale.', 'success');
            refreshPreview();
        });

        el.generateThemeBtn.addEventListener('click', () => {
            const generated = TL.generateFromBase(el.brandColorInput.value);
            currentConfig.settings.themeId = 'custom';
            currentConfig.settings.colors = generated.colors;
            currentConfig.settings.accentColor = generated.accentColor;
            renderThemeGrid();
            renderPalette();
            showStatus('Palette générée à partir de la couleur de marque.', 'success');
            schedulePreviewUpdate();
        });

        el.pinSetBtn.addEventListener('click', async () => {
            const pin = el.pinNew.value.trim();
            if (pin.length < 4) {
                showStatus('Le PIN doit contenir au moins 4 caractères.', 'error');
                return;
            }
            if (pin !== el.pinConfirm.value.trim()) {
                showStatus('Les deux PIN ne correspondent pas.', 'error');
                return;
            }
            await window.AdminLock.setPin(pin);
            el.pinNew.value = '';
            el.pinConfirm.value = '';
            renderPinStatus();
            showStatus('PIN défini pour ce poste.', 'success');
        });

        el.pinRemoveBtn.addEventListener('click', () => {
            if (!window.AdminLock.hasPin()) {
                showStatus('Aucun PIN n\'est actuellement défini.', 'error');
                return;
            }
            if (!confirm('Retirer le verrou PIN de l\'administration sur ce poste ?')) return;
            window.AdminLock.removePin();
            renderPinStatus();
            showStatus('Verrou PIN retiré.', 'success');
        });

        el.saveBtn.addEventListener('click', () => saveConfig());

        el.applyThemeBtn.addEventListener('click', () => {
            saveConfig('Thème appliqué et enregistré sur ce poste.');
            el.previewFrame.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

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

        // Aperçu en direct pour tous les champs "simples" (texte, nombre,
        // case à cocher, sélecteur de couleur manuel) : la galerie de
        // goodies, les thèmes et les actions sur les lignes de segments
        // appellent déjà schedulePreviewUpdate() explicitement ci-dessus.
        const configColumn = document.querySelector('.config-col');
        configColumn.addEventListener('input', schedulePreviewUpdate);
        configColumn.addEventListener('change', schedulePreviewUpdate);

        renderIconGallery();
    }

    init();
})();
