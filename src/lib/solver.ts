import observer from "./observer";
import gameMap from "./gameMap";
import simulationMap from "./simulationMap";

import types from "./def_type";
import consts from "./def_const";
import {weights_single} from "./weights";


export class solver {
    private logMode: boolean;
    private observer: observer | undefined;
    private SmltinMAP: simulationMap | undefined;
    private weights: weights_single | undefined;

    private inited = false;

    /**
     * 静态的表盘分析
     * 
     * 使用 `importMapFromXXX` 导入表盘
     * 
     * 调用前请**先调用 `gameMap.update` 方法**以获取最新数据
     * @returns 
     */
    constructor(weightInput?: weights_single, logMode = false) {
        this.logMode = logMode;
        if (weightInput) this.weights = weightInput;
    }

    importMapFrom2048Map(map: gameMap) {
        this.observer = new observer(map);
    }

    importMapFromSimulationMap(SMMAP: simulationMap) {
        this.SmltinMAP = SMMAP;
    }

    /** 单步决策 */
    decisionMaker_single(): types.DIRECTION_CODE | null {
        if (!this.observer) console.error(`[solver.decisionMaker_single] 单步决策依赖于 observer 对象, 请先使用 importMapFrom2048Map 创建该对象`);
        if (!this.weights) console.error(`[solver.decisionMaker_single] 单步决策依赖于 weights  对象, 请在构造时提供`);
        if (!this.observer || !this.weights) return null;

        let initialDirectionsWeight = (new Array(4)).fill(0);

        this.observer.update();

        let boxesAtEdge = this.observer.data.boxAtEdges;
        let directionsFeasibility = this.observer.data.drctnFsblty;
        let directionBoxesCanCombine = this.observer.data.drctnBoxCanCmbn;

        // 竖着走合并得多
        if (directionBoxesCanCombine[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] > directionBoxesCanCombine[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL]) {
            initialDirectionsWeight[types.DIRECTION_CODE.UPWARD] += directionBoxesCanCombine[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] * this.weights.combine;
            initialDirectionsWeight[types.DIRECTION_CODE.DOWNWARD] += directionBoxesCanCombine[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL] * this.weights.combine;
        }
        // 横着走合并得多
        else if (directionBoxesCanCombine[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] > directionBoxesCanCombine[types.VRTCL_HRZNTL_DIRECTION_CODE.VERTICAL]) {
            initialDirectionsWeight[types.DIRECTION_CODE.LEFT] += directionBoxesCanCombine[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] * this.weights.combine;
            initialDirectionsWeight[types.DIRECTION_CODE.RIGHT] += directionBoxesCanCombine[types.VRTCL_HRZNTL_DIRECTION_CODE.HORIZONTAL] * this.weights.combine;
        }

        // 考虑方向的可行性
        for (let i = 0; i < 4; i++) {
            initialDirectionsWeight[i] += directionsFeasibility[i] * this.weights.feasibleDirection;
        }

        // 考虑盒子的分布情况
        let mostBoxSideNum = Math.max(...boxesAtEdge);
        if (mostBoxSideNum !== 0) {
            for (let i = 0; i < boxesAtEdge.length; i++) {
                if (mostBoxSideNum === boxesAtEdge[i]) {
                    initialDirectionsWeight[i] += this.weights.borderDecision.this;
                    initialDirectionsWeight[(i - 2 >= 0) ? (i - 2) : (i + 2)] += this.weights.borderDecision.opposite;
                    initialDirectionsWeight[(i - 1 >= 0) ? (i - 1) : (i + 3)] += this.weights.borderDecision.side;
                    initialDirectionsWeight[(i + 1 < 4) ? (i + 1) : (i - 3)] += this.weights.borderDecision.side;
                }
            }
        }

        if (this.logMode) console.log(`NCB: \t[${directionBoxesCanCombine.join(", ")}]\nNLB: \t[${boxesAtEdge.join(", ")}]\nNFR: \t[${directionsFeasibility.join(", ")}]\nFDW: \t[${initialDirectionsWeight.join(", ")}]`);

        return initialDirectionsWeight.indexOf(Math.max(...initialDirectionsWeight));
    }

    /**多步决策
     * @param depthLimit 递归深度限制 (default=4)
     */
    decisionMaker_multiple(depthLimit = 4): number {
        if (!this.SmltinMAP) {
            console.error(`[solver.decisionMaker_multiple] 多步决策基于 simulationMap 对象, 请先使用 importMapFromSimulationMap 创建该对象`);
            return -1;
        }

        function getArraySum(arr: number[]): number {
            let sum = 0;
            arr.forEach((item: number) => {
                sum += item;
            })
            return sum;
        }

        function cloneMap<T>(map: T): T {
            return JSON.parse(JSON.stringify(map));
        }

        /**
         * Calculates the branch scores for a given simulation map and depth.
         *
         * @param StmltMAP - The simulation map to calculate branch scores for.
         * @param depth - The current depth of the simulation.
         * @param depthLimited - The maximum depth for branch scores calculation.
         * @return An array of branch scores for each direction.
         */
        function getBranchScores(StmltMAP: simulationMap, depth: number, depthLimited: number): number[] {
            depth++;

            let originalMap = cloneMap(StmltMAP.getMap());
            let socres = (new Array(4)).fill(0) as number[];

            for (let direction = 0; direction < 4; direction++) {
                if(!StmltMAP.getDirectionFeasibility(direction)) continue;

                let branchScore = StmltMAP.move(direction, false).score;

                if (depth >= depthLimited) {
                    socres[direction] = branchScore;
                } else {
                    socres[direction] = (getArraySum(getBranchScores(StmltMAP, depth, depthLimited)) + branchScore) / Math.pow(depth, 2);
                    // 不鼓励深层的递归（算法无法考虑随机因素）
                }

                StmltMAP.setMapFrom2048Map(originalMap);
            }

            StmltMAP.setMapFrom2048Map(originalMap);
            return socres;
        }

        let branchScores = getBranchScores(this.SmltinMAP, 0, depthLimit);

        for(let i = 0; i < 4; i++) {
            if(!this.SmltinMAP.getDirectionFeasibility(i)) branchScores[i] = -10000;
        }

        return branchScores.indexOf(Math.max(...branchScores))
    }
}

export default solver;