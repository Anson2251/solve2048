import types from "./def_type";
import consts from "./def_const";
import gameMap from "./gameMap";

/**
 * 2048 模拟表盘
 */
export class simulationMap {
    private map: types.map2048 = [];
    private logMode = false;
    private initialVal: number;
    private score = 0;
    private gameover = false;

    /**
     * 2048 模拟表盘
     * @param initialVal 默认值 `(default: 0)`
     * @param logMode 日志打印模式 `(default: false)` 
     */
    constructor(initialVal = 0, logMode = false) {
        this.logMode = logMode;
        this.initialVal = initialVal;

        this.initMap();
    }

    getScore() {
        return this.score;
    }

    getIfGameover() {
        return this.gameover;
    }

    getMap() {
        return this.map;
    }

    setMapFrom2048Map(map: types.map2048) {
        this.map = JSON.parse(JSON.stringify(map)); // 深拷贝表盘
    }

    setMapFromGameMap(map: gameMap) {
        this.map = map.getMap();
    }

    /**移动表盘
     * @param direction 方向
     * @param randomFill 是否进行表盘空余处的随机填充
     */
    move(direction: types.DIRECTION_CODE, randomFill = true) {
        let add = 0;
  
        interface movingResultType {
            /**操作得分 */
            score: number;
            /**游戏是否结束 */
            gameover: boolean
        }

        let movingResult: movingResultType = {
            score: 0,
            gameover: true
        }

        if (this.gameover) return movingResult;

        let mapBefore: types.map2048 = JSON.parse(JSON.stringify(this.map)); // 保存之前的表盘 (JSON 深拷贝)
        switch (direction) {
            case types.DIRECTION_CODE.LEFT: {
                add += this.combineToLeft();
                break;
            }
            case types.DIRECTION_CODE.RIGHT: {
                add += this.combineToRight();
                break;
            }
            case types.DIRECTION_CODE.UPWARD: {
                add += this.combineToTop();
                break;
            }
            case types.DIRECTION_CODE.DOWNWARD: {
                add += this.combineToBottom();
                break;
            }
        }

        if (randomFill) { // 随机填充
            if (((!this.isSameMap(mapBefore, this.map) || add) && !this.isFullMap())) {
                this.fillRandomCell();
            }
        }

        this.score += add;
        this.gameover = (this.isFullMap() && !this.canCombine());

        movingResult.score = add;
        movingResult.gameover = this.gameover;

        return movingResult;
    }

    getDirectionFeasibility(direction: types.DIRECTION_CODE){
        // types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL == 1
        // types.DIRECTION_CODE.LEFT == 1, so direction % 2 gives the VRTCL_HRZNTL code
        return !!(this.getDirectionFeasibilityWithoutCombine(direction) || this.getDirectionBoxesCanCombine()[direction%2])
        // !! cast to boolean from number
    }

    private getDirectionFeasibilityWithoutCombine(direction: types.DIRECTION_CODE) {
            let feasibility = 0;

            //检查上方向
            switch (direction) {
                case types.DIRECTION_CODE.UPWARD: {
                    for (let x = 0; x < consts.MAP_WIDTH; x++) {
                        let hasEmpty = false;
                        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
                            if (this.isEmptyCol(x) || this.isFullCol(x)) break; // 跳过空列和满列

                            if (this.getVal(x, y) === 0) { // 有空白
                                if (y === 0) { // 在开头
                                    feasibility++;
                                    break;
                                }
                                else hasEmpty = true; // 有，但不一定在中间，可能在末尾
                            } else {
                                if (hasEmpty) {
                                    feasibility++; // 有夹在中间的空白
                                    hasEmpty = false;
                                    break;
                                }
                            }
                        }
                    }
                    break;
                }

                case types.DIRECTION_CODE.DOWNWARD: {
                    for (let x = 0; x < consts.MAP_WIDTH; x++) {
                        let hasEmpty = false;
                        for (let y = consts.MAP_HEIGHT - 1; y >= 0; y--) {
                            if (this.isEmptyCol(x) || this.isFullCol(x)) break; // 跳过空列和满列

                            if (this.getVal(x, y) === 0) { // 有空白
                                if (y === consts.MAP_HEIGHT - 1) { // 在开头
                                    feasibility++;
                                    break;
                                }
                                else hasEmpty = true; // 有，但不一定在中间，可能在末尾
                            } else {
                                if (hasEmpty) {
                                    feasibility++; // 有夹在中间的空白
                                    hasEmpty = false;
                                    break;
                                }
                            }
                        }
                    }
                    break;
                }

                case types.DIRECTION_CODE.LEFT: {
                    for (let y = 0; y < consts.MAP_HEIGHT; y++) {
                        let hasEmpty = false;
                        for (let x = 0; x < consts.MAP_WIDTH; x++) {
                            if (this.isEmptyRow(y) || this.isFullRow(y)) break; // 跳过空行和满行

                            if (this.getVal(x, y) === 0) { // 有空白
                                if (x === 0) { // 在开头
                                    feasibility++;
                                    break;
                                }
                                else hasEmpty = true; //有空白，但不一定在中间
                            } else {
                                if (hasEmpty) {
                                    feasibility++; //有夹在中间的空白
                                    hasEmpty = false;
                                    break;
                                }
                            }
                        }
                    }
                    break;
                }

                case types.DIRECTION_CODE.RIGHT: {
                    for (let y = 0; y < consts.MAP_HEIGHT; y++) {
                        let hasEmpty = false;
                        for (let x = consts.MAP_WIDTH - 1; x >= 0; x--) {
                            if (this.isEmptyRow(y) || this.isFullRow(y)) break; // 跳过空行和满行

                            if (this.getVal(x, y) === 0) { // 有空白
                                if (x === consts.MAP_WIDTH - 1) { // 在开头
                                    feasibility++;
                                    break;
                                }
                                else hasEmpty = true; //有空白，但不一定在中间
                            } else {
                                if (hasEmpty) {
                                    feasibility++; //有夹在中间的空白
                                    hasEmpty = false;
                                    break;
                                }
                            }
                        }
                    }

                    break;
                }
            }

            return (feasibility > 0);
    }

    private getCellContiniousValueDirections(x: number, y: number): types.VerticalHorizontal_Array {
        const val = this.getVal(x, y);
        if (val === 0) return [0, 0];

        let matchedDirection: types.VerticalHorizontal_Array = [0, 0];


        // 查找左边
        for (let i = x - 1; i >= 0; i--) {
            const currentVal = this.getVal(i, y);
            if (currentVal === 0) continue;
            if (currentVal === val) matchedDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL]++;
            else break;
        }

        // 查找右边
        for (let i = x + 1; i < consts.MAP_WIDTH; i++) {
            const currentVal = this.getVal(i, y);
            if (currentVal === 0) continue;
            if (currentVal === val) matchedDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL]++;
            else break;
        }

        // 查找上边
        for (let i = y - 1; i >= 0; i--) {
            const currentVal = this.getVal(x, i);
            if (currentVal === 0) continue;
            if (currentVal === val) matchedDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL]++;
            else break;
        }

        // 查找下边
        for (let i = y + 1; i < consts.MAP_HEIGHT; i++) {
            const currentVal = this.getVal(x, i);
            if (currentVal === 0) continue;
            if (currentVal === val) matchedDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL]++;
            else break;
        }

        return matchedDirection;
    }

    private getDirectionBoxesCanCombine(): types.VerticalHorizontal_Array {
        let directions: types.VerticalHorizontal_Array = [0, 0];

        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            for (let x = 0; x < consts.MAP_WIDTH; x++) {
                if (this.getVal(x, y) !== 0) {
                    let continiousDirection = this.getCellContiniousValueDirections(x, y);
                    directions[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] +=
                        continiousDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] * Math.log2(this.getVal(x, y));
                    
                    directions[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] +=
                        continiousDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] * Math.log2(this.getVal(x, y));
                }
            }
        }

        return directions;
    }

    /**初始化表盘 */
    private initMap() {
        this.map = (new Array(consts.MAP_HEIGHT)).fill(null).map(() => (new Array(consts.MAP_WIDTH)).fill(this.initialVal));
        this.fillRandomCell();
        this.fillRandomCell();
    }

    /**向左合并 */
    private combineToLeft() {
        let score = 0;
        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            //移动方块
            for (let x = 0; x < consts.MAP_WIDTH; x++) {
                if (this.getVal(x, y) === 0) continue;

                let nextPos = (() => {
                    for (let posX = x + 1; posX < consts.MAP_WIDTH; posX++) {
                        if (this.getVal(posX, y)) return posX;
                    }
                    return consts.MAP_WIDTH;
                })();

                if (nextPos < consts.MAP_WIDTH) {
                    let curVal = this.getVal(x, y);
                    let nextVal = this.getVal(nextPos, y);
                    if (curVal === nextVal) {
                        this.setVal(x, y, curVal * 2);
                        score += curVal * 2;
                        this.setVal(nextPos, y, 0);
                    }
                }
            }

            //将方块靠左放置
            for (let x = 0; x < consts.MAP_WIDTH; x++) {
                if (this.getVal(x, y) === 0) {
                    let nextVal = ((() => {
                        for (let nx = x; nx < consts.MAP_WIDTH; nx++) {
                            if (this.getVal(nx, y) !== 0) return { val: this.getVal(nx, y), pos: nx };
                        }
                        return { val: 0, pos: 0 };
                    })());
                    if (nextVal.val === 0) break;
                    else {
                        this.setVal(x, y, nextVal.val);
                        this.setVal(nextVal.pos, y, 0);
                    }
                }
            }
        }
        return score
    }

    /**向右合并 */
    private combineToRight() {
        let score = 0;
        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            //移动方块
            for (let x = consts.MAP_WIDTH - 1; x >= 0; x--) {
                if (this.getVal(x, y) === 0) continue;

                let nextPos = (() => {
                    for (let posX = x - 1; posX >= 0; posX--) {
                        if (this.getVal(posX, y)) return posX; // find the first non-zero block on the left
                    }
                    return -1;
                })();

                if (nextPos >= 0) {
                    let curVal = this.getVal(x, y);
                    let nextVal = this.getVal(nextPos, y);
                    if (curVal === nextVal) {
                        this.setVal(x, y, curVal * 2); // merge the two same block
                        score += curVal * 2;
                        this.setVal(nextPos, y, 0); // clear the block (has emerged with another)
                    }
                }
            }

            //将方块靠右放置
            for (let x = consts.MAP_WIDTH - 1; x >= 0; x--) {
                if (this.getVal(x, y) === 0) {
                    let nextVal = ((() => {
                        for (let nx = x; nx >= 0; nx--) {
                            if (this.getVal(nx, y) !== 0) return { val: this.getVal(nx, y), pos: nx };
                        }
                        return { val: 0, pos: 0 };
                    })());
                    if (nextVal.val === 0) break;
                    else {
                        this.setVal(x, y, nextVal.val);
                        this.setVal(nextVal.pos, y, 0);
                    }
                }
            }
        }

        return score;
    }

    /**向上合并 */
    private combineToTop() {
        let score = 0;
        for (let x = 0; x < consts.MAP_WIDTH; x++) {
            //移动方块
            for (let y = 0; y < consts.MAP_HEIGHT; y++) {
                if (this.getVal(x, y) === 0) continue;

                let nextPos = (() => {
                    for (let posY = y + 1; posY < consts.MAP_HEIGHT; posY++) {
                        if (this.getVal(x, posY)) return posY;
                    }
                    return consts.MAP_HEIGHT;
                })();

                if (nextPos < consts.MAP_HEIGHT) {
                    let curVal = this.getVal(x, y);
                    let nextVal = this.getVal(x, nextPos);
                    if (curVal === nextVal) {
                        this.setVal(x, y, curVal * 2);
                        score += curVal * 2;
                        this.setVal(x, nextPos, 0);
                    }
                }
            }

            //将方块靠上放置
            for (let y = 0; y < consts.MAP_HEIGHT; y++) {
                if (this.getVal(x, y) === 0) {
                    let nextVal = ((() => {
                        for (let ny = y; ny < consts.MAP_HEIGHT; ny++) {
                            if (this.getVal(x, ny) !== 0) return { val: this.getVal(x, ny), pos: ny };
                        }
                        return { val: 0, pos: 0 };
                    })());
                    if (nextVal.val === 0) break;
                    else {
                        this.setVal(x, y, nextVal.val);
                        this.setVal(x, nextVal.pos, 0);
                    }
                }
            }
        }

        return score;
    }

    /**向下合并 */
    private combineToBottom() {
        let score = 0;
        for (let x = 0; x < consts.MAP_WIDTH; x++) {
            //移动方块
            for (let y = consts.MAP_HEIGHT - 1; y >= 0; y--) {
                if (this.getVal(x, y) === 0) continue;

                let nextPos = (() => {
                    for (let posY = y - 1; posY >= 0; posY--) {
                        if (this.getVal(x, posY)) return posY;
                    }
                    return -1;
                })();

                if (nextPos >= 0) {
                    let curVal = this.getVal(x, y);
                    let nextVal = this.getVal(x, nextPos);
                    if (curVal === nextVal) {
                        this.setVal(x, y, curVal * 2);
                        score += curVal * 2;
                        this.setVal(x, nextPos, 0);
                    }
                }
            }

            //将方块靠下放置
            for (let y = consts.MAP_HEIGHT - 1; y >= 0; y--) {
                if (this.getVal(x, y) === 0) {
                    let nextVal = ((() => {
                        for (let ny = y; ny >= 0; ny--) {
                            if (this.getVal(x, ny) !== 0) return { val: this.getVal(x, ny), pos: ny };
                        }
                        return { val: 0, pos: 0 };
                    })());
                    if (nextVal.val === 0) break;
                    else {
                        this.setVal(x, y, nextVal.val);
                        this.setVal(x, nextVal.pos, 0);
                    }
                }
            }
        }

        return score;
    }

    /**判断是否还有能合并的方块 */
    private canCombine() {
        for (let x = 0; x < consts.MAP_WIDTH; x++) {
            for (let y = 0; y < consts.MAP_HEIGHT - 1; y++) {
                if (this.getVal(x, y) === this.getVal(x, y + 1)) return true;
            }
        }
        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            for (let x = 0; x < consts.MAP_WIDTH - 1; x++) {
                if (this.getVal(x, y) === this.getVal(x + 1, y)) return true;
            }
        }
        return false;
    }

    /**随机填充一个空格子 */
    private fillRandomCell() {
        let randomNumber = this.getRandomNumber(0, 10);
        if (randomNumber >= 8) randomNumber = 4;
        else randomNumber = 2;
        const randomCell = this.getRandomCell();

        if (randomCell) this.setVal(randomCell.col, randomCell.row, randomNumber);
    }

    /**随机获取一个空的单元格坐标 */
    private getRandomCell() {
        const empty = this.getEmptyCell();
        if (empty.length > 0) {
            const randomIndex = this.getRandomNumber(0, empty.length);
            return empty[randomIndex];
        } else {
            return null;
        }
    }

    /**
     * 获取介于 `min-max` 之间的随机数
     * @param min 最小值 (包括)
     * @param max 最大值 (不包括)
     * @returns 
     */
    private getRandomNumber(min: number, max: number) {
        return Math.floor(Math.random() * 10 * max) % (max - min) + min;
    }

    /**获取所有的空的单元格列表 */
    private getEmptyCell() {
        let empty: ({
            col: number;
            row: number;
        })[] = [];

        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            for (let x = 0; x < consts.MAP_WIDTH; x++) {
                if (!this.getVal(x, y)) empty.push({ col: x, row: y })
            }
        }
        return empty;
    }

    /**
     * 判断是否为同一张表盘
     * @param map1 表盘
     * @param map2 表盘（默认为 `simulationMap.map`）
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

    /**设置表盘中的值 `(x, y)` */
    setVal(x: number, y: number, val: number): number {
        return this.map[y][x] = val;
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

    /**表盘是否已满 */
    isFullMap() {
        for (let x = 0; x < consts.MAP_WIDTH; x++) {
            if (!this.isFullCol(x)) return false;
        }
        return true;
    }
}

export default simulationMap;