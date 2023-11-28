import types from "./def_type";
import consts from "./def_const";

export class gameMap {
    private map: types.map2048;
    private logMode = false;
    private container: HTMLDivElement
    private initialVal: number;

    /**
     * 2048 表盘操作
     * @param initialVal 默认值 `(default: 0)`
     * @param logMode 日志打印模式 `(default: false)` 
     */
    constructor(initialVal = 0, logMode = false) {
        this.logMode = logMode;
        this.initialVal = initialVal;
        this.container = document.querySelector(consts.CONTAINER_CSS_PATH) as HTMLDivElement;
        this.map = (new Array(consts.MAP_HEIGHT)).fill(null).map(() => (new Array(consts.MAP_WIDTH)).fill(this.initialVal));
        this.update();
    }

    /**更新表盘
     * 
     * 返回 `true` 则成功
     * 
     * 返回 `false` 则表明表盘未更新
     */
    update(): boolean{
        let newMap = (new Array(consts.MAP_HEIGHT)).fill(null).map(() => (new Array(consts.MAP_WIDTH)).fill(this.initialVal));

        const nodes = this.container.childNodes;

        if (nodes) {
            for (let i = 0; i < nodes.length; i++) {
                const className = ((nodes[i] as HTMLDivElement).className.match(consts.CSS_CLASS_MATCH) || [""])[0];

                const position = className.split("-");
                const row = parseInt(position.pop() as string) - 1;
                const col = parseInt(position.pop() as string) - 1;
                const val = parseInt((nodes[i] as HTMLDivElement).innerText);

                newMap[row][col] = val;
            }
        }

        let isDiff = !this.isSameMap(this.map, newMap);
        if(isDiff) this.map = newMap;

        return isDiff;
    }

    /**
     * 判断是否为同一张表盘
     * @param map1 表盘
     * @param map2 表盘（默认为 `gameMap.map`）
     */
    isSameMap(map1: types.map2048, map2?: types.map2048): boolean {
        if(!map2) map2 = this.map;
        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            for (let x = 0; x < consts.MAP_WIDTH; x++) {
                if (map1[y][x] !== map2[y][x]) return false;
            }
        }

        return true;
    }

    /**从表盘中获取值 `(x, y)` */
    getVal(x: number, y: number): number {
        return this.map[y][x] || 0;
    }

    getMap(){
        return this.map;
    }

    /**发送方向命令 (上下左右) */
    move(direction: types.DIRECTION_CODE): void {
        let keydownEvent: KeyboardEvent | undefined;
        let keyupEvent: KeyboardEvent | undefined;

        switch (direction) {
            case 0: {
                keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                keyupEvent = new KeyboardEvent('keyup', { key: 'ArrowUp' });

                if (this.logMode) console.log("top");
                break;
            }
            case 1: {
                keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
                keyupEvent = new KeyboardEvent('keyup', { key: 'ArrowLeft' });

                if (this.logMode) console.log("left");
                break;
            }
            case 2: {
                keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                keyupEvent = new KeyboardEvent('keyup', { key: 'ArrowDown' });

                if (this.logMode) console.log("down");
                break;
            }
            case 3: {
                keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                keyupEvent = new KeyboardEvent('keyup', { key: 'ArrowRight' });

                if (this.logMode) console.log("right")
                break;
            }
        }

        if (keydownEvent && keyupEvent) {
            document.dispatchEvent(keydownEvent);
            document.dispatchEvent(keyupEvent);
        }else{
            console.error(`[gameMap.emitMoveCmd] 方向代号 ${direction} 无效`);
        }
    }

    /**`col` 列是否为空列 */
    isEmptyCol(col: number): boolean {
        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            if (this.map[y][col] !== 0) return false;
        }
        return true;
    }

    /**`row` 行是否为空行 */
    isEmptyRow(row: number): boolean {
        for (let x = 0; x < consts.MAP_HEIGHT; x++) {
            if (this.map[row][x] !== 0) return false;
        }
        return true;
    }

    /**`col` 列是否为满列 */
    isFullCol(col: number): boolean {
        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            if (this.map[y][col] === 0) return false;
        }
        return true;
    }

    /**`row` 行是否为满行 */
    isFullRow(row: number): boolean {
        for (let x = 0; x < consts.MAP_HEIGHT; x++) {
            if (this.map[row][x] === 0) return false;
        }
        return true;
    }
}

export default gameMap;