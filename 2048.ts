export namespace solve {
    type map2048 = number[][];

    /**上下左右方向 长度为4 */
    type directionsArray = number[];
    /**竖直水平方向 长度为2 */
    type VrtclHrzntlArray = number[];

    const MAP_HEIGHT = 4;
    const MAP_WIDTH = 4;

    const AVERAGE_ACCURACY = 1;
    const EVO_WIDTH = 5;
    const EVO_DEPTH_LIMIT = 5;
    const enum EVO_RELATIONSHIP_MAP {
        COMBINE_WEIGHT = 0,
        FEASIBILE_APPROCH_WEIGHT = 1,
        BORDER_DECISION_WEIGHT__THIS = 2,
        BORDER_DECISION_WEIGHT__SIDE = 3,
        BORDER_DECISION_WEIGHT__OPPOSITE = 4
    }
    export let relationShipMap = {};

    /** 合并权重 */
    let COMBINE_WEIGHT = 16;
    /** 路径权重 */
    let FEASIBILE_APPROCH_WEIGHT = 4;
    /** 方块分布权重 */
    let BORDER_DECISION_WEIGHT = {
        THIS: 0,
        SIDE: 2,
        OPPOSITE: 1
    };

    /**操作延时 */
    const DELAY_TIME = 1000;

    const TIMEOUT_TIMES_LIMIT = 10;

    const CONTAINER_CSS_PATH = ".tile-container";
    const SCORE_CSS_PATH = "html body div.container div.heading div.scores-container div.score-container";
    const CSS_CLASS_MATCH = /tile-position-[0-9]-[0-9]/g;

    /**上下左右的方向代号 */
    const enum DIRECTION_CODE {
        UPWARD = 0,
        LEFT = 1,
        DOWNWARD = 2,
        RIGHT = 3
    }

    /**竖直-水平方向代号 */
    const enum VRTCL_HRZNTL_DIRECTION_CODE {
        VERTICAL = 0,
        HORIZONTAL = 1
    }

    /**
     * 启动加载
     */
    export async function loader(trainingMode: boolean = false) {
        if (trainingMode) {
            const startTime = (new Date()).getTime();
            const result = await loadTrainingMode();
            const timeTaken = ((new Date()).getTime() - startTime) / 1000;
            const largestVal = Math.max(...(getMapFromHTML().reduce((prev: number[], curr: number[]) => prev.concat(curr))));
            console.log(`操作次数: ${result.count}  得分: ${result.score}\n用时: ${timeTaken}s  最大合成: ${largestVal}`);
        } else {
            loadUserMode();
        }
    }

    export async function training_executor() {
        function getRandomWeightDiff() {
            return Math.round(Math.random() * 1000) % 3 - 1;
        }

        function generateNewRandomWeight() {
            let weights = getWeigts();

            for(let i = 0; i < weights.length; i++){
                weights[i] += getRandomWeightDiff();
            }

            return weights;
        }

        async function evoNextLevel(depth: number, fatherName: string, fatherScore: number) {
            let newMap: any = {};

            depth++;

            if (depth < EVO_DEPTH_LIMIT && depth < EVO_DEPTH_LIMIT) {
                setWeights(JSON.parse(fatherName) as number[]);
                console.log(`进化层级: ${depth + 1} 祖先权重: ${fatherName}  祖先得分: ${fatherScore}`)
                for (let i = 0; i <= EVO_WIDTH; i++) {
                    if (i === 0) newMap[fatherName] = fatherScore;
                    else {
                        let newWeights;

                        do { // 避免重复的突变权重
                            newWeights = generateNewRandomWeight();
                        }
                        while(newMap[JSON.stringify(newWeights)])
                        
                        console.log(`进化层级: ${depth + 1}  后代序号: ${i}/${EVO_WIDTH}  突变权重: ${JSON.stringify(newWeights)}`);
                        newMap[JSON.stringify(newWeights)] = await training_testWeight(newWeights);
                    }
                }

                let maxVal = 0;
                let maxName = "";
                for (let curName of Object.keys(newMap)) {
                    if (newMap[curName] > maxVal) {
                        maxVal = newMap[curName];
                        maxName = curName;
                        bestWeight = JSON.parse(maxName);
                    }
                }

                if (depth < EVO_DEPTH_LIMIT - 1) {
                    console.log(`进化层级: ${depth + 1}  最优权重: ${maxName} 得分: ${maxVal}`);
                    newMap[maxName] = await evoNextLevel(depth, maxName, maxVal);
                }

            }

            return newMap;
        }

        let bestWeight: number[] = [];
        let result = await evoNextLevel(-1, JSON.stringify(getWeigts()), (await loadTrainingMode()).score);
        console.log(JSON.stringify(result, null, "  "));
        console.log(bestWeight);
        return result;
    }

    export async function training_testWeight(weights: number[]) {
        let oldWeights = getWeigts(); // 备份原始权重
        setWeights(weights);

        console.log(`正在测试权重 ${JSON.stringify(weights)}`);

        let results = [];
        for (let i = 0; i < AVERAGE_ACCURACY; i++) {
            const result = await loadTrainingMode();
            results.push(result.score);

            console.log(`已测试: ${i + 1}/${AVERAGE_ACCURACY}  得分: ${result.score}`);
        }

        let average = getAverageVal(results);
        setWeights(oldWeights); // 还原原始权重

        console.log(`测试完毕，平均得分: ${average}`);
        return average;
    }

    async function loadTrainingMode() {
        restartGame();

        let map = getMapFromHTML();
        let mapOld: map2048 = (new Array(4)).fill(0).map(() => (new Array(4)).fill(0));

        let count: number;
        let timeoutTimes = 0;
        let command: number = 0;
        
        for (count = 0; timeoutTimes < TIMEOUT_TIMES_LIMIT; count++) {
            if(!isSameMap(map, mapOld)) timeoutTimes = 0;
            else {
                timeoutTimes++;
                executor(command, false);
                console.warn(`面板未响应，剩余等待次数: ${TIMEOUT_TIMES_LIMIT - timeoutTimes}`);
                await sleep(100); // 额外等待时间
            }

            command = decisionMaker(map, false);
            executor(command, false);

            mapOld = map;
            await sleep(50);
            map = getMapFromHTML();
        }

        const score = parseInt((document.querySelector(SCORE_CSS_PATH) as HTMLElement).innerText);
        return { count, score };
    }

    function loadUserMode() {
        let map = getMapFromHTML();
        let mapOld: map2048 = (new Array(4)).fill(0).map(() => (new Array(4)).fill(0));
        const processor = setInterval(() => {
            map = getMapFromHTML();
            if (isSameMap(map, mapOld)) {
                setTimeout(() => {
                    console.log(`game over \nreason: ${isFullMap(getMapFromHTML()) ? "run out of space" : "algorithm error"}`);
                }, DELAY_TIME * 2)
                clearInterval(processor);
            }

            const command = decisionMaker(map);
            executor(command);

            mapOld = JSON.parse(JSON.stringify(map));
        }, DELAY_TIME);

        document.addEventListener("keyup", (e) => {
            if (e.keyCode == 27) clearInterval(processor);
        });
    }

    /**
     * 获取表盘及方块布局
     * @returns 
     */
    export function getMapFromHTML(): map2048 {
        let map: number[][] = (new Array(4)).fill(0).map(() => (new Array(4)).fill(0));

        const container = document.querySelector(CONTAINER_CSS_PATH);
        if (!container) return map;
        const nodes = container.childNodes;

        if (nodes) {

            for (let i = 0; i < nodes.length; i++) {
                let className = ((nodes[i] as HTMLDivElement).className.match(CSS_CLASS_MATCH) || [""])[0];

                let position = className.split("-");
                let row = position.pop() as string;
                let col = position.pop() as string;

                map[parseInt(row) - 1][parseInt(col) - 1] = parseInt((nodes[i] as HTMLDivElement).innerText)
            }
        }

        return map;
    }

    /**
     * 发送指定按键消息
     * @param code 
     */
    function sentKeyCode(code: number): void {
        const keydown = new KeyboardEvent('keydown', { 'keyCode': code, 'which': code });
        const keyup = new KeyboardEvent('keyup', { 'keyCode': code, 'which': code });

        document.dispatchEvent(keydown);
        document.dispatchEvent(keyup);
    }

    export function executor(command: number, logMode: boolean = true): void {
        switch (command) {
            case 0: {
                sentKeyCode(38);
                if (logMode) console.log("top");
                break;
            }
            case 1: {
                sentKeyCode(37);
                if (logMode) console.log("left");
                break;
            }
            case 2: {
                sentKeyCode(40);
                if (logMode) console.log("down");
                break;
            }
            case 3: {
                sentKeyCode(39);
                if (logMode) console.log("right")
                break;
            }
        }
    }

    export function decisionMaker(map: map2048, logMode: boolean = true) {
        let initialDirectionsWeight = (new Array(4)).fill(0);

        let boxesAtEdge = list_boxesAtEdge(map);
        let directionsFeasibility = list_directionsFeasibility(map);
        let directionBoxesCanCombine = list_directionBoxesCanCombine(map);

        // 竖着走合并得多
        if (directionBoxesCanCombine[VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] > directionBoxesCanCombine[VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL]) {
            initialDirectionsWeight[DIRECTION_CODE.UPWARD] += directionBoxesCanCombine[VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] * COMBINE_WEIGHT;
            initialDirectionsWeight[DIRECTION_CODE.DOWNWARD] += directionBoxesCanCombine[VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] * COMBINE_WEIGHT;
        }
        // 横着走合并得多
        else if (directionBoxesCanCombine[VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] > directionBoxesCanCombine[VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL]) {
            initialDirectionsWeight[DIRECTION_CODE.LEFT] += directionBoxesCanCombine[VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] * COMBINE_WEIGHT;
            initialDirectionsWeight[DIRECTION_CODE.RIGHT] += directionBoxesCanCombine[VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] * COMBINE_WEIGHT;
        }

        // 考虑方向的可行性
        for (let i = 0; i < 4; i++) {
            initialDirectionsWeight[i] += directionsFeasibility[i] * FEASIBILE_APPROCH_WEIGHT;
        }

        // 盒子少往哪走
        let largestSide = Math.max(...boxesAtEdge);
        if (largestSide !== 0) {
            for (let i = 0; i < boxesAtEdge.length; i++) {
                if (largestSide == boxesAtEdge[i]) {
                    initialDirectionsWeight[(i - 2 >= 0) ? (i - 2) : (i + 2)] += BORDER_DECISION_WEIGHT.OPPOSITE;
                    initialDirectionsWeight[(i - 1 >= 0) ? (i - 1) : (i + 3)] += BORDER_DECISION_WEIGHT.SIDE;
                    initialDirectionsWeight[(i + 1 < 4) ? (i + 1) : (i - 3)] += BORDER_DECISION_WEIGHT.SIDE;
                }
            }
        }

        if (logMode) console.log(`DBCC: \t[${directionBoxesCanCombine.join(", ")}]\nBAE: \t[${boxesAtEdge.join(", ")}]\nDF: \t[${directionsFeasibility.join(", ")}]\nFDW: \t[${initialDirectionsWeight.join(", ")}]`);

        return initialDirectionsWeight.indexOf(Math.max(...initialDirectionsWeight));
    }

    /**
     * 获取处于边界的方块数
     * @param map 2048地图
     * @returns
     */
    export function list_boxesAtEdge(map: map2048): directionsArray {
        let border: directionsArray = (new Array(4)).fill(0);

        // 上
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (getValueFromMap(map, x, 0) !== 0) border[DIRECTION_CODE.UPWARD]++;
        }

        // 下
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (getValueFromMap(map, x, MAP_HEIGHT - 1) !== 0) border[DIRECTION_CODE.DOWNWARD]++;
        }

        // 左
        for (let y = 0; y < MAP_HEIGHT; y++) {
<<<<<<< HEAD
            if (getValueFromMap(map, y, 0) !== 0) border[DIRECTION_CODE.LEFT]++;
=======
            if (getValueFromMap(map, 0, y) !== 0) border[DIRECTION_CODE.LEFT]++;
>>>>>>> 21378a9 (add multiple decision maker algorithm)
        }

        // 右
        for (let y = 0; y < MAP_HEIGHT; y++) {
<<<<<<< HEAD
            if (getValueFromMap(map, y, MAP_WIDTH - 1) !== 0) border[DIRECTION_CODE.RIGHT]++;
=======
            if (getValueFromMap(map, MAP_WIDTH - 1, y) !== 0) border[DIRECTION_CODE.RIGHT]++;
>>>>>>> 21378a9 (add multiple decision maker algorithm)
        }

        return border;
    }

    /**
     * 获取水平(竖直)方向上操作可行的行(列)数
     * @param map 2048 地图
     */
    export function list_directionsFeasibility(map: map2048): directionsArray {
        let directions: directionsArray = (new Array(4)).fill(0);

        function isEmptyCol(map: map2048, x: number): boolean {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                if (getValueFromMap(map, x, y) !== 0) return false;
            }
            return true;
        }

        function isFullCol(map: map2048, x: number): boolean {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                if (getValueFromMap(map, x, y) === 0) return false;
            }
            return true;
        }

        function isEmptyRow(map: map2048, y: number): boolean {
            for (let x = 0; x < MAP_HEIGHT; x++) {
                if (getValueFromMap(map, x, y) !== 0) return false;
            }
            return true;
        }

        function isFullRow(map: map2048, y: number): boolean {
            for (let x = 0; x < MAP_HEIGHT; x++) {
                if (getValueFromMap(map, x, y) === 0) return false;
            }
            return true;
        }

        //检查上方向
        let upFeasibility = 0;
        for (let x = 0; x < MAP_WIDTH; x++) {
            let hasEmpty = false;
            for (let y = 0; y < MAP_HEIGHT; y++) {
                if (isEmptyCol(map, x) || isFullCol(map, x)) break; // 跳过空列和满列

                if (getValueFromMap(map, x, y) === 0) { // 有空白
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
        for (let x = 0; x < MAP_WIDTH; x++) {
            let hasEmpty = false;
            for (let y = MAP_HEIGHT - 1; y >= 0; y--) {
                if (isEmptyCol(map, x) || isFullCol(map, x)) break; // 跳过空列和满列

                if (getValueFromMap(map, x, y) === 0) { // 有空白
                    if (y === MAP_HEIGHT - 1) { // 在开头
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
        for (let y = 0; y < MAP_HEIGHT; y++) {
            let hasEmpty = false;
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (isEmptyRow(map, y) || isFullRow(map, y)) break; // 跳过空行和满行

                if (getValueFromMap(map, x, y) === 0) { // 有空白
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
        for (let y = 0; y < MAP_HEIGHT; y++) {
            let hasEmpty = false;
            for (let x = MAP_WIDTH - 1; x >= 0; x--) {
                if (isEmptyRow(map, y) || isFullRow(map, y)) break; // 跳过空行和满行

                if (getValueFromMap(map, x, y) === 0) { // 有空白
                    if (x === MAP_WIDTH - 1) { // 在开头
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

        directions[DIRECTION_CODE.UPWARD] = upFeasibility;
        directions[DIRECTION_CODE.DOWNWARD] = downFeasibility;
        directions[DIRECTION_CODE.LEFT] = leftFeasibility;
        directions[DIRECTION_CODE.RIGHT] = rightFeasibility;

        return directions;
    }

    /**
     * 列出相同值的方块在不同方向上的可合并数量
     * @param map 2048 地图
     * @returns 
     */
    export function list_directionBoxesCanCombine(map: map2048): VrtclHrzntlArray {
        let directions: VrtclHrzntlArray = (new Array(2)).fill(0);

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (getValueFromMap(map, x, y) !== 0) {
                    let continiousDirection = list_continiousValueDirections(map, x, y);
                    directions[VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] += continiousDirection[VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] * Math.log2(getValueFromMap(map, x, y));
                    directions[VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] += continiousDirection[VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] * Math.log2(getValueFromMap(map, x, y));
                }
            }
        }

        return directions;
    }

    /**
    * 列出相同值的方块在不同方向上的连续性
    * @param map 2048 地图
    * @param x 
    * @param y 
    */
    export function list_continiousValueDirections(map: map2048, x: number, y: number): VrtclHrzntlArray {
        const val = getValueFromMap(map, x, y);
        if (val === 0) return [0, 0];

        let matchedDirection: VrtclHrzntlArray = (new Array(2)).fill(0);


        // 查找左边
        for (let i = x - 1; i >= 0; i--) {
            const currentVal = getValueFromMap(map, i, y);

            if (currentVal === 0) continue;

            if (currentVal === val) matchedDirection[VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL]++;
            else break;
        }

        // 查找右边
        for (let i = x + 1; i < MAP_WIDTH; i++) {
            const currentVal = getValueFromMap(map, i, y);

            if (currentVal === 0) continue;

            if (currentVal === val) matchedDirection[VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL]++;
            else break;
        }

        // 查找上边
        for (let i = y - 1; i >= 0; i--) {
            const currentVal = getValueFromMap(map, x, i);

            if (currentVal === 0) continue;

            if (currentVal === val) matchedDirection[VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL]++;
            else break;
        }

        // 查找下边
        for (let i = y + 1; i < MAP_HEIGHT; i++) {
            const currentVal = getValueFromMap(map, x, i);

            if (currentVal === 0) continue;

            if (currentVal === val) matchedDirection[VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL]++;
            else break;
        }

        return matchedDirection;
    }

    function getValueFromMap(map: map2048, x: number, y: number): number {
        return map[y][x];
    }

    function isSameMap(map1: map2048, map2: map2048): boolean {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (getValueFromMap(map1, x, y) !== getValueFromMap(map2, x, y)) return false;
            }
        }

        return true;
    }

    function isFullMap(map: map2048): boolean {
        for (let row of map) {
            for (let item of row) {
                if (item === 0) return false;
            }
        }
        return true;
    }

    function restartGame() {
        eval(`document.querySelector("html body div.container div.above-game a.restart-button").click()`);
    }

    function getAverageVal(arr: number[]) {
        let sum = 0;
        for (let num of arr) sum += num;
        return Math.round(sum / arr.length);
    }

    function setWeights(weights: number[]): void {
        COMBINE_WEIGHT = weights[EVO_RELATIONSHIP_MAP.COMBINE_WEIGHT];
        FEASIBILE_APPROCH_WEIGHT = weights[EVO_RELATIONSHIP_MAP.FEASIBILE_APPROCH_WEIGHT];
        BORDER_DECISION_WEIGHT.THIS = weights[EVO_RELATIONSHIP_MAP.BORDER_DECISION_WEIGHT__THIS];
        BORDER_DECISION_WEIGHT.SIDE = weights[EVO_RELATIONSHIP_MAP.BORDER_DECISION_WEIGHT__SIDE];
        BORDER_DECISION_WEIGHT.OPPOSITE = weights[EVO_RELATIONSHIP_MAP.BORDER_DECISION_WEIGHT__OPPOSITE];
    }

    function getWeigts(): number[] {
        let weights = [];
        weights[EVO_RELATIONSHIP_MAP.COMBINE_WEIGHT] = COMBINE_WEIGHT;
        weights[EVO_RELATIONSHIP_MAP.FEASIBILE_APPROCH_WEIGHT] = FEASIBILE_APPROCH_WEIGHT;
        weights[EVO_RELATIONSHIP_MAP.BORDER_DECISION_WEIGHT__THIS] = BORDER_DECISION_WEIGHT.THIS;
        weights[EVO_RELATIONSHIP_MAP.BORDER_DECISION_WEIGHT__SIDE] = BORDER_DECISION_WEIGHT.SIDE;
        weights[EVO_RELATIONSHIP_MAP.BORDER_DECISION_WEIGHT__OPPOSITE] = BORDER_DECISION_WEIGHT.OPPOSITE;
        return weights;
    }

    const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

    (window["solve2048" as any] as any) = solve;
}

export default solve;

