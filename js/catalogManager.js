/**
 * Bal Oldali Katalógus és Kategóriakezelő Menedzser (catalogManager.js)
 * Kategóriák kezelése, bútorok mentése automatikus 3D előnézettel, visszatöltés, export/import
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

        this.loadFromStorage();
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
                this.items = JSON.parse(itemJson);
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
        return newCat;
    }

    updateCategory(id, newName, newColor) {
        const cat = this.categories.find(c => c.id === id);
        if (!cat) return null;
        if (newName) cat.name = newName.trim();
        if (newColor) cat.color = newColor;
        this.saveCategoriesToStorage();
        this.notifyChange();
        return cat;
    }

    deleteCategory(id) {
        this.categories = this.categories.filter(c => c.id !== id);
        // Az adott kategóriában lévő bútorokat áttesszük 'uncategorized'-be vagy töröljük
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
    }

    getCategoryById(id) {
        if (id === 'all') return { id: 'all', name: 'Összes bútor', color: '#6366f1' };
        if (id === 'uncategorized') return { id: 'uncategorized', name: 'Egyéb / Nincs kategória', color: '#94a3b8' };
        return this.categories.find(c => c.id === id) || { id: id, name: 'Ismeretlen', color: '#94a3b8' };
    }

    /**
     * Kijelölt korpusz vagy egyedi bútorlap mentése a katalógusba izolált 3D fotóval
     */
    saveSelectedToCatalog(savingTarget, name, categoryId, description = '') {
        if (!savingTarget || !savingTarget.target) {
            alert('Nincs kijelölt elem a mentéshez!');
            return null;
        }

        let boardsData = null;
        let dimensions = { w: 600, h: 720, d: 560 };
        let boardCount = 1;

        if (savingTarget.type === 'corpus') {
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

        // Csak a kijelölt elem látszódik a kisképben!
        const thumbnail = this.scene3D.getSnapshot(savingTarget.target, 400, 300);

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
        return newItem;
    }

    /**
     * Jelenlegi bútor mentése a bal oldali katalógusba automatikus 3D fotóval
     */
    saveCurrentFurnitureToCatalog(name, categoryId, description = '') {
        const boardsData = this.boardManager.toJSON();
        if (boardsData.corpora.length === 0 && boardsData.boards.length === 0) {
            alert('A 3D tér üres! Hozz létre legalább egy bútorlapot a mentéshez.');
            return null;
        }

        const bounds = this.boardManager.getFurnitureBoundingBox();
        const thumbnail = this.scene3D.getSnapshot(null, 400, 300);

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
        this.items = this.items.filter(i => i.id !== itemId);
        this.saveItemsToStorage();
        this.notifyChange();
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
