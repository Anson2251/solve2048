import types from "./def_type";
import consts from "./def_const";
import gameMap from "./gameMap";

interface observerResultDataStrut{
    /** 处于边界的方块数 */
    boxAtEdges: types.directionsArray,
    /** 水平(竖直)方向上操作可行的行(列)数 */
    drctnFsblty: types.directionsArray,
    /** 相同值的方块在不同方向上的可合并数量 */
    drctnBoxCanCmbn: types.VerticalHorizontal_Array
}

export class observer {
    private map: gameMap;
    data: observerResultDataStrut

    constructor(map: gameMap) {
        this.map = map;
        this.data = this.update();
    }

    /**
     * 更新数据
     * @param updateCfg 
     * @returns 
     */
    update(): observerResultDataStrut{
        //this.map.update(); // 地图的更新全部统一放入决策层

        let newData: observerResultDataStrut = {
            boxAtEdges: this.getBoxesAtEdge(),
            drctnBoxCanCmbn: this.getDirectionBoxesCanCombine(),
            drctnFsblty: this.getDirectionsFeasibility()
        }

        this.data = newData;
        return newData;
    }

    /** 获取处于边界的方块数 */
    private getBoxesAtEdge(): types.directionsArray {
        let border: types.directionsArray = [0, 0, 0, 0];

        // 上
        for (let x = 0; x < consts.MAP_WIDTH; x++) {
            if (this.map.getVal(x, 0) !== 0) border[types.DIRECTION_CODE.UPWARD]++;
        }

        // 下
        for (let x = 0; x < consts.MAP_WIDTH; x++) {
            if (this.map.getVal(x, consts.MAP_HEIGHT - 1) !== 0) border[types.DIRECTION_CODE.DOWNWARD]++;
        }

        // 左
        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            if (this.map.getVal(0, y) !== 0) border[types.DIRECTION_CODE.LEFT]++;
        }

        // 右
        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            if (this.map.getVal(consts.MAP_WIDTH - 1, y) !== 0) border[types.DIRECTION_CODE.RIGHT]++;
        }

        return border;
    }

    /** 获取水平(竖直)方向上操作可行的行(列)数 */
    private getDirectionsFeasibility(): types.directionsArray {
        let directions: types.directionsArray = [0, 0, 0, 0];

        //检查上方向
        let upFeasibility = 0;
        for (let x = 0; x < consts.MAP_WIDTH; x++) {
            let hasEmpty = false;
            for (let y = 0; y < consts.MAP_HEIGHT; y++) {
                if (this.map.isEmptyCol(x) || this.map.isFullCol(x)) break; // 跳过空列和满列

                if (this.map.getVal(x, y) === 0) { // 有空白
                    if (y === 0) { // 在开头
                        upFeasibility++;
                        break;
                    }
                    else hasEmpty = true; // 有，但不一定在中间，可能在末尾
                } else {
                    if (hasEmpty) {
                        upFeasibility++; // 有夹在中间的空白
                        hasEmpty = false;
                        break;
                    }
                }
            }
        }

        //检查下方向
        let downFeasibility = 0;
        for (let x = 0; x < consts.MAP_WIDTH; x++) {
            let hasEmpty = false;
            for (let y = consts.MAP_HEIGHT - 1; y >= 0; y--) {
                if (this.map.isEmptyCol(x) || this.map.isFullCol(x)) break; // 跳过空列和满列

                if (this.map.getVal(x, y) === 0) { // 有空白
                    if (y === consts.MAP_HEIGHT - 1) { // 在开头
                        downFeasibility++;
                        break;
                    }
                    else hasEmpty = true; // 有，但不一定在中间，可能在末尾
                } else {
                    if (hasEmpty) {
                        downFeasibility++; // 有夹在中间的空白
                        hasEmpty = false;
                        break;
                    }
                }
            }
        }

        //检查左方向
        let leftFeasibility = 0;
        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            let hasEmpty = false;
            for (let x = 0; x < consts.MAP_WIDTH; x++) {
                if (this.map.isEmptyRow(y) || this.map.isFullRow(y)) break; // 跳过空行和满行

                if (this.map.getVal(x, y) === 0) { // 有空白
                    if (x === 0) { // 在开头
                        leftFeasibility++;
                        break;
                    }
                    else hasEmpty = true; //有空白，但不一定在中间
                } else {
                    if (hasEmpty) {
                        leftFeasibility++; //有夹在中间的空白
                        hasEmpty = false;
                        break;
                    }
                }
            }
        }

        //检查右方向
        let rightFeasibility = 0;
        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            let hasEmpty = false;
            for (let x = consts.MAP_WIDTH - 1; x >= 0; x--) {
                if (this.map.isEmptyRow(y) || this.map.isFullRow(y)) break; // 跳过空行和满行

                if (this.map.getVal(x, y) === 0) { // 有空白
                    if (x === consts.MAP_WIDTH - 1) { // 在开头
                        rightFeasibility++;
                        break;
                    }
                    else hasEmpty = true; //有空白，但不一定在中间
                } else {
                    if (hasEmpty) {
                        rightFeasibility++; //有夹在中间的空白
                        hasEmpty = false;
                        break;
                    }
                }
            }
        }

        directions[types.DIRECTION_CODE.UPWARD] = upFeasibility;
        directions[types.DIRECTION_CODE.DOWNWARD] = downFeasibility;
        directions[types.DIRECTION_CODE.LEFT] = leftFeasibility;
        directions[types.DIRECTION_CODE.RIGHT] = rightFeasibility;

        return directions;
    }

    /** 列出相同值的方块在不同方向上的可合并数量 */
    private getDirectionBoxesCanCombine(): types.VerticalHorizontal_Array {
        let directions: types.VerticalHorizontal_Array = [0, 0];

        for (let y = 0; y < consts.MAP_HEIGHT; y++) {
            for (let x = 0; x < consts.MAP_WIDTH; x++) {
                if (this.map.getVal(x, y) !== 0) {
                    let continiousDirection = this.getContiniousValueDirections(x, y);
                    directions[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] +=
                        continiousDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] * Math.log2(this.map.getVal(x, y));
                    
                        directions[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] +=
                        continiousDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] * Math.log2(this.map.getVal(x, y));
                }
            }
        }

        return directions;
    }

    /** 列出相同值的方块在不同方向上的连续性 (base) */
    private getContiniousValueDirections(x: number, y: number): types.VerticalHorizontal_Array {
        const val = this.map.getVal(x, y);
        if (val === 0) return [0, 0];

        let matchedDirection: types.VerticalHorizontal_Array = [0, 0];


        // 查找左边
        for (let i = x - 1; i >= 0; i--) {
            const currentVal = this.map.getVal(i, y);
            if (currentVal === 0) continue; // jump for the empty
            if (currentVal === val) matchedDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL]++;
            else break;
        }

        // 查找右边
        for (let i = x + 1; i < consts.MAP_WIDTH; i++) {
            const currentVal = this.map.getVal(i, y);
            if (currentVal === 0) continue;
            if (currentVal === val) matchedDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL]++;
            else break;
        }

        // 查找上边
        for (let i = y - 1; i >= 0; i--) {
            const currentVal = this.map.getVal(x, i);
            if (currentVal === 0) continue;
            if (currentVal === val) matchedDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL]++;
            else break;
        }

        // 查找下边
        for (let i = y + 1; i < consts.MAP_HEIGHT; i++) {
            const currentVal = this.map.getVal(x, i);
            if (currentVal === 0) continue;
            if (currentVal === val) matchedDirection[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL]++;
            else break;
        }

        return matchedDirection;
    }
}

export default observer;