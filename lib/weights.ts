import types from "./def_type"

/**权重 */
export class weights_single {
    combine: number;
    feasibleDirection: number;
    borderDecision: {
        this: number;
        side: number;
        opposite: number;
    }

    /**
     * @param weightInput 输入的初始权重
     */
    constructor(weightInput: types.weights){
        this.combine = weightInput.combine;
        this.feasibleDirection = weightInput.feasibleDirection;
        this.borderDecision = weightInput.borderDecision;
    }

    /**
     * 根据当前权重生成新的随机权重
     * @returns 
     */
    generateNewRandomWeights(){
        const newWeights: types.weights = {
            combine: this.combine + this.generateRandomWeightDiff(-1, 1),
            feasibleDirection: this.feasibleDirection + this.generateRandomWeightDiff(-1, 1),
            borderDecision: {
                this: this.borderDecision.this + this.generateRandomWeightDiff(-1, 1),
                side: this.borderDecision.side + this.generateRandomWeightDiff(-1, 1),
                opposite: this.borderDecision.opposite + this.generateRandomWeightDiff(-1, 1)
            }
        }

        return new weights_single(newWeights);
    }

    private generateRandomWeightDiff(min: number, max: number){
        return Math.floor(Math.random() * 10 * max) % (max - min) + min;
    }
    
}
