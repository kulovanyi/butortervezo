/**
 * Intelligens Illesztő és Igazító Motor (snapEngine.js)
 * Bútorlapok felületeinek, éleinek egymáshoz tapasztása, mágneses illesztés és polc-kalkuláció
 */

export class SnapEngine {
    constructor(boardManager, scene3D) {
        this.boardManager = boardManager;
        this.scene3D = scene3D;
    }

    /**
     * Bútorlap határoló dobozának (Bounding Box) lekérése mm-ben
     */
    getBounds(board) {
        const halfW = board.width / 2;
        const halfH = board.height / 2;
        const halfD = board.depth / 2;

        return {
            minX: board.x - halfW,
            maxX: board.x + halfW,
            minY: board.y - halfH,
            maxY: board.y + halfH,
            minZ: board.z - halfD,
            maxZ: board.z + halfD,
            centerX: board.x,
            centerY: board.y,
            centerZ: board.z,
            width: board.width,
            height: board.height,
            depth: board.depth
        };
    }

    /**
     * Kijelölt lap illesztése egy referencia laphoz adott reláció szerint
     * @param {string} sourceId - A mozgatandó lap ID-je
     * @param {string} targetId - A referencia lap ID-je
     * @param {string} relation - 'top_outer', 'bottom_outer', 'left_outer', 'left_inner', 'right_outer', 'right_inner', 'front', 'back'
     * @param {number} gap - Opcionális távolság / hézag mm-ben
     */
    snapToBoard(sourceId, targetId, relation, gap = 0) {
        const source = this.boardManager.boards.find(b => b.id === sourceId);
        const target = this.boardManager.boards.find(b => b.id === targetId);
        if (!source || !target) return null;

        const sBounds = this.getBounds(source);
        const tBounds = this.getBounds(target);

        const newPos = { x: source.x, y: source.y, z: source.z };

        switch (relation) {
            case 'top_outer': // Cél felületére helyezés (felülre tapasztás)
                newPos.y = tBounds.maxY + (source.height / 2) + gap;
                break;
            case 'bottom_outer': // Cél lap alá függesztés
                newPos.y = tBounds.minY - (source.height / 2) - gap;
                break;
            case 'left_outer': // Bal oldalára kívülről
                newPos.x = tBounds.minX - (source.width / 2) - gap;
                break;
            case 'left_inner': // Bal belső falához belülről
                newPos.x = tBounds.minX + (source.width / 2) + gap;
                break;
            case 'right_outer': // Jobb oldalára kívülről
                newPos.x = tBounds.maxX + (source.width / 2) + gap;
                break;
            case 'right_inner': // Jobb belső falához belülről
                newPos.x = tBounds.maxX - (source.width / 2) - gap;
                break;
            case 'front_outer': // Elé tapasztás (pl. ajtó vagy fiókelő)
                newPos.z = tBounds.maxZ + (source.depth / 2) + gap;
                break;
            case 'back_outer': // Mögé tapasztás (pl. hátfal)
                newPos.z = tBounds.minZ - (source.depth / 2) - gap;
                break;
        }

        this.boardManager.updateBoard(sourceId, newPos);
        return newPos;
    }

    /**
     * Két lap éleinek egy vonalba igazítása (Alignment)
     * @param {string} sourceId 
     * @param {string} targetId 
     * @param {string} alignAxis - 'align_left', 'align_right', 'align_top', 'align_bottom', 'align_front', 'align_back', 'center_x', 'center_y', 'center_z'
     */
    alignBoards(sourceId, targetId, alignAxis) {
        const source = this.boardManager.boards.find(b => b.id === sourceId);
        const target = this.boardManager.boards.find(b => b.id === targetId);
        if (!source || !target) return null;

        const sBounds = this.getBounds(source);
        const tBounds = this.getBounds(target);

        const newPos = { x: source.x, y: source.y, z: source.z };

        switch (alignAxis) {
            case 'align_left':
                newPos.x = tBounds.minX + (source.width / 2);
                break;
            case 'align_right':
                newPos.x = tBounds.maxX - (source.width / 2);
                break;
            case 'align_top':
                newPos.y = tBounds.maxY - (source.height / 2);
                break;
            case 'align_bottom':
                newPos.y = tBounds.minY + (source.height / 2);
                break;
            case 'align_front':
                newPos.z = tBounds.maxZ - (source.depth / 2);
                break;
            case 'align_back':
                newPos.z = tBounds.minZ + (source.depth / 2);
                break;
            case 'center_x':
                newPos.x = tBounds.centerX;
                break;
            case 'center_y':
                newPos.y = tBounds.centerY;
                break;
            case 'center_z':
                newPos.z = tBounds.centerZ;
                break;
        }

        this.boardManager.updateBoard(sourceId, newPos);
        return newPos;
    }

    /**
     * Intelligens polc beillesztése két oldalfal közé
     * Automatikusan leméri a két lap közötti távolságot és beállítja a polc szélességét!
     */
    fitShelfBetween(leftBoardId, rightBoardId, shelfY = null, thickness = 18) {
        const leftBoard = this.boardManager.boards.find(b => b.id === leftBoardId);
        const rightBoard = this.boardManager.boards.find(b => b.id === rightBoardId);
        if (!leftBoard || !rightBoard) return null;

        const leftBounds = this.getBounds(leftBoard);
        const rightBounds = this.getBounds(rightBoard);

        // Kiszámítjuk a belső távolságot
        const innerDistance = Math.abs(rightBounds.minX - leftBounds.maxX);
        if (innerDistance <= 0) return null;

        const centerX = (leftBounds.maxX + rightBounds.minX) / 2;
        const targetY = shelfY !== null ? shelfY : ((leftBounds.centerY + rightBounds.centerY) / 2);
        const depth = Math.min(leftBoard.depth, rightBoard.depth) - 10; // 10mm front visszaugrás

        const shelf = this.boardManager.createBoard({
            name: `Belső polc (${Math.round(innerDistance)}x${Math.round(depth)})`,
            type: 'shelf',
            width: innerDistance,
            height: thickness,
            depth: depth,
            thickness: thickness,
            x: centerX,
            y: targetY,
            z: (leftBounds.centerZ + rightBounds.centerZ) / 2 - 5,
            textureKey: leftBoard.textureKey
        });

        return shelf;
    }

    /**
     * Mágneses keresés a legközelebbi lapfelületekhez
     */
    findNearestSnapTarget(sourceId, threshold = 40) {
        const source = this.boardManager.boards.find(b => b.id === sourceId);
        if (!source) return null;

        const sBounds = this.getBounds(source);
        let bestCandidate = null;
        let minDistance = Infinity;

        for (const target of this.boardManager.boards) {
            if (target.id === sourceId) continue;
            const tBounds = this.getBounds(target);

            // Távolságok a határoló dobozok között
            const dx = Math.max(0, sBounds.minX - tBounds.maxX, tBounds.minX - sBounds.maxX);
            const dy = Math.max(0, sBounds.minY - tBounds.maxY, tBounds.minY - sBounds.maxY);
            const dz = Math.max(0, sBounds.minZ - tBounds.maxZ, tBounds.minZ - sBounds.maxZ);

            const dist = Math.hypot(dx, dy, dz);
            if (dist < minDistance && dist <= threshold) {
                minDistance = dist;
                bestCandidate = { target, distance: dist, tBounds, sBounds };
            }
        }

        return bestCandidate;
    }
}
