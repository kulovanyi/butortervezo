/**
 * Bal Oldali Katalógus és Kategóriakezelő Menedzser (catalogManager.js)
 * Kategóriák kezelése, bútorok mentése automatikus 3D előnézettel, visszatöltés, export/import,
 * valamint automatikus szinkronizáció a Firebase Felhővel, a helyi Python szerverrel és a GitHub-bal.
 */

export class CatalogManager {
    constructor(boardManager, scene3D, onCatalogChange) {
        this.boardManager = boardManager;
        this.scene3D = scene3D;
        this.onCatalogChange = onCatalogChange;

        this.categories = [];
        this.items = [];
        this.activeCategoryId = 'all'; // 'all' vagy konkrét category id
        this.searchQuery = '';

        this.storageKeyCategories = 'butortervezo_categories_v1';
        this.storageKeyItems = 'butortervezo_items_v1';

        // 1. Gyors betöltés LocalStorage-ből az azonnali megjelenítéshez
        this.loadFromStorage();

        // 2. Háttérben lekérés a szervertől (data/catalog.json - GitHub szinkron)
        this.fetchServerCatalog();

        // 3. Firebase Felhős Szinkronizáció inicializálása
        this.initFirebase();
    }

    /**
     * Firebase szinkron inicializálása
     */
    initFirebase() {
        if (typeof window !== 'undefined' && window.FirebaseSync) {
            window.FirebaseSync.init((cloudData) => {
                this.handleCloudCatalogUpdate(cloudData);
            });
        }
    }

    /**
     * Felhőből (Firebase) érkező valós idejű katalógus frissítés kezelése
     */
    handleCloudCatalogUpdate(cloudData) {
        if (!cloudData) return;

        let changed = false;

        if (cloudData.categories && Array.isArray(cloudData.categories)) {
            cloudData.categories.forEach(cCat => {
                const exists = this.categories.some(c => c.id === cCat.id);
                if (!exists) {
                    this.categories.push(cCat);
                    changed = true;
                }
            });
        }

        if (cloudData.items && Array.isArray(cloudData.items)) {
            if (this.items.length === 0 && cloudData.items.length > 0) {
                this.items = cloudData.items;
                changed = true;
            } else {
                cloudData.items.forEach(cItem => {
                    const exists = this.items.some(i => i.id === cItem.id);
                    if (!exists) {
                        this.items.push(cItem);
                        changed = true;
                    }
                });
            }
        }

        if (changed) {
            this.saveCategoriesToStorage();
            this.saveItemsToStorage();
            this.notifyChange();
            this.showToast('☁️ Új bútorok szinkronizálva a felhőből!', 'info');
        }
    }

    /**
     * Elegáns, lebegő értesítés megjelenítése a képernyő sarkában
     */
    showToast(message, type = 'info') {
        let container = document.getElementById('catalog-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'catalog-toast-container';
            container.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 18px;
            border-radius: 8px;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
            box-shadow: 0 8px 24px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            gap: 10px;
            pointer-events: auto;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateY(20px);
            opacity: 0;
        `;

        if (type === 'success') {
            toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            toast.style.border = '1px solid #34d399';
        } else if (type === 'warning') {
            toast.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            toast.style.border = '1px solid #fbbf24';
        } else if (type === 'error') {
            toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            toast.style.border = '1px solid #f87171';
        } else {
            toast.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
            toast.style.border = '1px solid #60a5fa';
        }

        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);

        // Animált beúszás
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });

        // Eltűnés 3.5 mp után
        setTimeout(() => {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    /**
     * Katalógus adatok lekérése a helyi backend szervertől (data/catalog.json)
     */
    async fetchServerCatalog() {
        try {
            const res = await fetch('/api/catalog');
            if (!res.ok) return;

            const serverData = await res.json();
            let changed = false;

            // Kategóriák összefésülése a szerver adataival
            if (serverData.categories && Array.isArray(serverData.categories) && serverData.categories.length > 0) {
                serverData.categories.forEach(sCat => {
                    const exists = this.categories.some(c => c.id === sCat.id);
                    if (!exists) {
                        this.categories.push(sCat);
                        changed = true;
                    }
                });
            }

            // Bútorok összefésülése a szerver adataival
            if (serverData.items && Array.isArray(serverData.items)) {
                if (this.items.length === 0 && serverData.items.length > 0) {
                    this.items = serverData.items;
                    changed = true;
                } else {
                    serverData.items.forEach(sItem => {
                        const exists = this.items.some(i => i.id === sItem.id);
                        if (!exists) {
                            this.items.push(sItem);
                            changed = true;
                        }
                    });
                }
            }

            if (changed) {
                this.saveCategoriesToStorage();
                this.saveItemsToStorage();
                this.notifyChange();
                console.log('Katalógus sikeresen szinkronizálva a szerverrel/GitHub-bal.');
            }
        } catch (e) {
            // Nincs szerverkapcsolat (pl. offline vagy közvetlen fájlmegnyitás)
            console.log('Katalógus offline módban fut (LocalStorage aktív).');
        }
    }

    /**
     * Katalógus elküldése a szervernek és a Firebase felhőbe
     */
    async syncToServer(actionDescription = 'Katalógus frissítés') {
        let firebaseSaved = false;
        let localServerSaved = false;

        // 1. Mentés a Firebase Felhőbe (ha csatlakozva van)
        if (typeof window !== 'undefined' && window.FirebaseSync && window.FirebaseSync.isConnected) {
            firebaseSaved = await window.FirebaseSync.saveCatalog(this.categories, this.items, actionDescription);
        }

        // 2. Mentés a helyi Python szervernek és Git Push
        try {
            const res = await fetch('/api/catalog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: actionDescription,
                    categories: this.categories,
                    items: this.items
                })
            });

            if (res.ok) {
                localServerSaved = true;
            }
        } catch (e) {
            // Nincs Python szerver
        }

        // Visszajelzés a felhasználónak
        if (firebaseSaved && localServerSaved) {
            this.showToast('☁️ Mentve a Firebase Felhőbe & GitHub-ra! 🚀', 'success');
        } else if (firebaseSaved) {
            this.showToast('☁️ Sikeresen mentve a Firebase Felhőbe! 🌐', 'success');
        } else if (localServerSaved) {
            this.showToast('💾 Katalógus mentve & feltöltve a GitHub-ra! 🚀', 'success');
        } else {
            this.showToast('💾 Katalógus mentve a böngészőben (Helyi)', 'info');
        }
    }

    /**
     * Adatok betöltése LocalStorage-ből (vagy alapértelmezett kategóriák inicializálása)
     */
    loadFromStorage() {
        try {
            const catJson = localStorage.getItem(this.storageKeyCategories);
            const itemJson = localStorage.getItem(this.storageKeyItems);

            if (catJson) {
                this.categories = JSON.parse(catJson);
            } else {
                this.categories = [
                    { id: 'cat_kitchen', name: 'Konyhabútor', icon: 'utensils', color: '#f59e0b' },
                    { id: 'cat_living', name: 'Nappali & Polcok', icon: 'tv', color: '#3b82f6' },
                    { id: 'cat_wardrobe', name: 'Gardrób & Szekrény', icon: 'archive', color: '#10b981' },
                    { id: 'cat_office', name: 'Irodabútor & Asztal', icon: 'briefcase', color: '#8b5cf6' },
                    { id: 'cat_bathroom', name: 'Fürdőszoba bútor', icon: 'droplet', color: '#06b6d4' }
                ];
                this.saveCategoriesToStorage();
            }

            if (itemJson) {
                this.items = JSON.parse(itemJson).filter(item => !item.id.startsWith('preset_'));
            } else {
                this.items = [];
            }
        } catch (e) {
            console.error('Hiba a katalógus betöltésekor:', e);
            this.categories = [];
            this.items = [];
        }
    }

    saveCategoriesToStorage() {
        try {
            localStorage.setItem(this.storageKeyCategories, JSON.stringify(this.categories));
        } catch (e) {
            console.error('Hiba a kategóriák mentésekor:', e);
        }
    }

    saveItemsToStorage() {
        try {
            localStorage.setItem(this.storageKeyItems, JSON.stringify(this.items));
        } catch (e) {
            console.error('Hiba a bútorok mentésekor:', e);
        }
    }

    notifyChange() {
        if (this.onCatalogChange) {
            this.onCatalogChange();
        }
    }

    // --- KATEGÓRIA MŰVELETEK ---

    addCategory(name, color = '#3b82f6', icon = 'folder') {
        if (!name || name.trim() === '') return null;
        const newCat = {
            id: 'cat_' + Date.now(),
            name: name.trim(),
            color: color,
            icon: icon
        };
        this.categories.push(newCat);
        this.saveCategoriesToStorage();
        this.notifyChange();
        this.syncToServer(`Új kategória létrehozva: ${newCat.name}`);
        return newCat;
    }

    updateCategory(id, newName, newColor) {
        const cat = this.categories.find(c => c.id === id);
        if (!cat) return null;
        if (newName) cat.name = newName.trim();
        if (newColor) cat.color = newColor;
        this.saveCategoriesToStorage();
        this.notifyChange();
        this.syncToServer(`Kategória módosítva: ${cat.name}`);
        return cat;
    }

    deleteCategory(id) {
        const cat = this.categories.find(c => c.id === id);
        const catName = cat ? cat.name : id;
        this.categories = this.categories.filter(c => c.id !== id);
        // Az adott kategóriában lévő bútorokat áttesszük 'uncategorized'-be
        this.items.forEach(item => {
            if (item.categoryId === id) {
                item.categoryId = 'uncategorized';
            }
        });
        if (this.activeCategoryId === id) {
            this.activeCategoryId = 'all';
        }
        this.saveCategoriesToStorage();
        this.saveItemsToStorage();
        this.notifyChange();
        this.syncToServer(`Kategória törölve: ${catName}`);
    }

    getCategoryById(id) {
        if (id === 'all') return { id: 'all', name: 'Összes bútor', color: '#6366f1' };
        if (id === 'uncategorized') return { id: 'uncategorized', name: 'Egyéb / Nincs kategória', color: '#94a3b8' };
        return this.categories.find(c => c.id === id) || { id: id, name: 'Ismeretlen', color: '#94a3b8' };
    }

    /**
     * Kijelölt korpusz vagy egyedi bútorlap mentése a katalógusba izolált 3D fotóval
     */
    saveSelectedToCatalog(savingTarget, name, categoryId, description = '', customThumbnail = null, snapshotAngle = 'iso-right') {
        if (!savingTarget || (!savingTarget.target && !savingTarget.targets)) {
            alert('Nincs kijelölt elem a mentéshez!');
            return null;
        }

        let boardsData = null;
        let dimensions = { w: 600, h: 720, d: 560 };
        let boardCount = 1;

        if (savingTarget.type === 'multiple') {
            const targets = savingTarget.targets || [];
            boardsData = this.boardManager.getMultiTargetsJSON(targets);
            const bounds = this.boardManager.getMultiTargetsBoundingBox(targets);
            dimensions = {
                w: bounds.width || 600,
                h: bounds.height || 720,
                d: bounds.depth || 560
            };
            boardCount = this.boardManager.getMultiTargetsBoardCount(targets);
        } else if (savingTarget.type === 'corpus') {
            boardsData = this.boardManager.getCorpusJSON(savingTarget.id);
            const corpus = this.boardManager.corpora.find(c => c.userData.id === savingTarget.id);
            if (corpus) {
                dimensions = {
                    w: corpus.userData.width || 600,
                    h: corpus.userData.height || 720,
                    d: corpus.userData.depth || 560
                };
                boardCount = corpus.children.length;
            }
        } else if (savingTarget.type === 'group') {
            boardsData = this.boardManager.getGroupJSON(savingTarget.id);
            const grp = this.boardManager.customGroups.find(g => g.userData.id === savingTarget.id);
            const childBoards = this.boardManager.boards.filter(b => b.groupId === savingTarget.id);
            if (grp) {
                dimensions = {
                    w: grp.userData.width || 600,
                    h: grp.userData.height || 800,
                    d: grp.userData.depth || 400
                };
                boardCount = childBoards.length;
            }
        } else {
            boardsData = this.boardManager.getSingleBoardJSON(savingTarget.id);
            const board = this.boardManager.boards.find(b => b.id === savingTarget.id);
            if (board) {
                dimensions = {
                    w: board.width,
                    h: board.height,
                    d: board.depth
                };
                boardCount = 1;
            }
        }

        if (!boardsData) {
            alert('Nem sikerült kinyerni a kijelölt elem adatait.');
            return null;
        }

        // Kiskép készítése a kijelölt elemekről (1:1 arány)
        const snapTarget = savingTarget.type === 'multiple' ? savingTarget.targets : savingTarget.target;
        const thumbnail = customThumbnail || this.scene3D.getSnapshot(snapTarget, 512, 512, snapshotAngle || 'iso-right');

        const newItem = {
            id: 'item_' + Date.now(),
            name: name && name.trim() !== '' ? name.trim() : (savingTarget.name || `Bútor ${this.items.length + 1}`),
            categoryId: categoryId || (this.categories[0] ? this.categories[0].id : 'uncategorized'),
            description: (description || '').trim(),
            dimensions: dimensions,
            boardCount: boardCount,
            thumbnail: thumbnail,
            boards: boardsData,
            createdAt: new Date().toISOString()
        };

        this.items.unshift(newItem);
        this.saveItemsToStorage();
        this.notifyChange();
        this.syncToServer(`Bútor mentve a katalógusba: ${newItem.name}`);
        return newItem;
    }

    /**
     * Jelenlegi bútor mentése a bal oldali katalógusba automatikus 3D fotóval
     */
    saveCurrentFurnitureToCatalog(name, categoryId, description = '', customThumbnail = null, snapshotAngle = 'iso-right') {
        const boardsData = this.boardManager.toJSON();
        if (boardsData.corpora.length === 0 && boardsData.boards.length === 0) {
            alert('A 3D tér üres! Hozz létre legalább egy bútorlapot a mentéshez.');
            return null;
        }

        const bounds = this.boardManager.getFurnitureBoundingBox();
        const thumbnail = customThumbnail || this.scene3D.getSnapshot(null, 512, 512, snapshotAngle || 'iso-right');

        const newItem = {
            id: 'item_' + Date.now(),
            name: name && name.trim() !== '' ? name.trim() : `Bútor ${this.items.length + 1}`,
            categoryId: categoryId || (this.categories[0] ? this.categories[0].id : 'uncategorized'),
            description: description.trim(),
            dimensions: {
                w: bounds.width,
                h: bounds.height,
                d: bounds.depth
            },
            boardCount: this.boardManager.boards.length,
            thumbnail: thumbnail,
            boards: boardsData,
            createdAt: new Date().toISOString()
        };

        this.items.unshift(newItem); // Elejére szúrjuk be
        this.saveItemsToStorage();
        this.notifyChange();
        this.syncToServer(`Bútor mentve a katalógusba: ${newItem.name}`);
        return newItem;
    }

    /**
     * Katalógus bútor betöltése a 3D munkatérbe
     * @param {string} itemId 
     * @param {boolean} replaceCurrent - true: lecseréli a meglévő bútorokat, false: melléilleszti
     */
    loadFurnitureToScene(itemId, replaceCurrent = false) {
        const item = this.items.find(i => i.id === itemId);
        if (!item || !item.boards) return null;

        if (replaceCurrent) {
            this.boardManager.fromJSON(item.boards, true);
        } else {
            // Meglévő bútorok mellé helyezés X eltolással
            const currentBounds = this.boardManager.getFurnitureBoundingBox();
            const itemW = (item.dimensions && item.dimensions.w) || 600;
            const offsetX = currentBounds.width > 0 ? (currentBounds.width / 2 + itemW / 2 + 100) : 0;

            if (Array.isArray(item.boards)) {
                const shiftedBoards = item.boards.map(b => ({
                    ...b,
                    x: (b.x || 0) + offsetX
                }));
                this.boardManager.fromJSON(shiftedBoards, false);
            } else if (typeof item.boards === 'object') {
                const shiftedData = {
                    corpora: (item.boards.corpora || []).map(c => ({
                        ...c,
                        x: (c.x || 0) + offsetX
                    })),
                    boards: (item.boards.boards || []).map(b => ({
                        ...b,
                        x: (b.x || 0) + offsetX
                    }))
                };
                this.boardManager.fromJSON(shiftedData, false);
            }
        }

        return item;
    }

    deleteItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        const itemName = item ? item.name : itemId;
        this.items = this.items.filter(i => i.id !== itemId);
        this.saveItemsToStorage();
        this.notifyChange();
        this.syncToServer(`Bútor törölve a katalógusból: ${itemName}`);
    }

    /**
     * Szűrt katalógus elemek lekérése (kategória és keresés alapján)
     */
    getFilteredItems() {
        return this.items.filter(item => {
            const matchesCategory = (this.activeCategoryId === 'all') || (item.categoryId === this.activeCategoryId);
            const matchesSearch = !this.searchQuery || 
                item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }

    /**
     * Teljes katalógus exportálása letölthető JSON fájlba
     */
    exportCatalogJSON() {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            categories: this.categories,
            items: this.items
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `butor_katalogus_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Katalógus importálása JSON fájlból
     */
    importCatalogJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.categories && Array.isArray(data.categories)) {
                        // Összefésüljük a meglévő kategóriákkal
                        data.categories.forEach(cat => {
                            if (!this.categories.some(c => c.id === cat.id)) {
                                this.categories.push(cat);
                            }
                        });
                    }
                    if (data.items && Array.isArray(data.items)) {
                        // Összefésüljük a bútorokkal
                        data.items.forEach(item => {
                            if (!this.items.some(i => i.id === item.id)) {
                                this.items.push(item);
                            }
                        });
                    }
                    this.saveCategoriesToStorage();
                    this.saveItemsToStorage();
                    this.notifyChange();
                    this.syncToServer('Katalógus importálva');
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}
