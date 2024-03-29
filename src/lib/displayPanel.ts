import gameMap from "./gameMap";
import solver from "./solver";
import simulationMap from "./simulationMap";
import types from "./def_type";
import consts from "./def_const";
import { weights_single } from "./weights";

export class displayPanel {
    panelContainer: HTMLDivElement;
    usingMultiple: boolean;
    suggestionBox: HTMLDivElement;

    map: gameMap;
    weight: weights_single;
    smmap: simulationMap;
    solverSingle: solver;
    solverMultiple: solver;

    multipleLimit: number;
    constructor(multipleLimit?: number) {
        this.multipleLimit = multipleLimit || 4;
        this.usingMultiple = false;

        this.map = new gameMap(0, false);
        this.weight = new weights_single(consts.INITIAL_WEIGHT);

        this.smmap = new simulationMap(0, false);

        this.solverSingle = new solver(this.weight, false);
        this.solverSingle.importMapFrom2048Map(this.map);

        this.solverMultiple = new solver();
        this.solverMultiple.importMapFromSimulationMap(this.smmap);

        this.suggestionBox = this.initSuggestionBox();

        let bodyElement = document.querySelector("body");
        let panelContainer = document.createElement("div");
        this.panelContainer = panelContainer;

        panelContainer.className = "displayPanel";

        let depthLimit = this.initLimitInput();
        let depthLimitContiner = depthLimit.container;
        //let depthLimitInput = depthLimit.input;

        panelContainer.appendChild(this.initModeSwitch());
        panelContainer.appendChild(depthLimitContiner);
        panelContainer.appendChild(this.suggestionBox);

        bodyElement?.appendChild(panelContainer);

        this.setAutoUpdateSuggestion();
        this.getSuggestion();
    }

    initModeSwitch(){
        let switchContainer = document.createElement("fieldset"); // for the field
        switchContainer.className = "modeSwitch";

        let fieldLabel = document.createElement("legend"); // for label
        fieldLabel.innerText = "Mode Switch";
        switchContainer.appendChild(fieldLabel);

        let switch_single = displayPanel.createRadioInput("single", "Single Mode");
        let switch_multiple = displayPanel.createRadioInput("multiple", "Multiple Mode");

        let container_single = switch_single.container;
        let container_multiple = switch_multiple.container;

        switchContainer.appendChild(container_single);
        switchContainer.appendChild(container_multiple);

        let input_single = switch_single.input;
        let input_multiple = switch_multiple.input;

        input_single.checked = true;
        input_single.onclick = () => { // change the multiple status
            this.usingMultiple = input_multiple.checked;
            this.getSuggestion();
        }
        input_multiple.onclick = () => { // change the multiple status
            this.usingMultiple = input_multiple.checked;
            this.getSuggestion();
        }

        return switchContainer;
    }

    initSuggestionBox(): HTMLDivElement {
        let suggestionBox = document.createElement("div");
        suggestionBox.className = "suggestionBox";

        return suggestionBox;
    }

    initLimitInput(): {
        input: HTMLInputElement;
        container: HTMLLabelElement;
    }{
        let limitInput = document.createElement("input");
        limitInput.type = "number";
        limitInput.className = "limitInput";
        limitInput.value = this.multipleLimit.toString();
        limitInput.onchange = () => {
            let newVal = parseInt(limitInput.value);
            if(newVal > displayPanel.recommandedMAXLimit) { // not recommand large number
                let confirmBox = confirm("Large number is not recommended, it will significantly slow down the speed");
                if(confirmBox){
                    this.multipleLimit = newVal;
                }else{
                    limitInput.value = this.multipleLimit.toString();
                }
            }
            else if(newVal < 1) {
                alert("Limit cannot be less than 1");
                limitInput.value = this.multipleLimit.toString();
            }
            else{
                this.multipleLimit  = newVal;
            }
            this.getSuggestion();
        }

        let container = document.createElement("label");
        container.title = "The depth limit of the decision tree, the greater, the better\nNOTICE: a larger value will significantly slow down the speed";
        container.className = "limitInputContainer";
        container.innerHTML = "&ensp;Depth Limit: ";
        container.appendChild(limitInput);

        return {
            input: limitInput,
            container: container
        };
    }

    getSuggestionSingle(): number{
        this.map.update();

        let direction = this.solverSingle.decisionMaker_single();

        if (direction || direction === 0) return direction;
        else {
            console.error(`solver(single) returns a null value`);
            return -1;
        }
    }

    getSuggestionMultiple(){
        this.map.update();
        this.smmap.setMapFrom2048Map(this.map.getMap());

        let direction = this.solverMultiple.decisionMaker_multiple(this.multipleLimit)
        if(direction || direction === 0) return direction;
        else {
            console.error(`solver(multiple) returns a null value`);
            return -1;
        }
    }

    async getSuggestion(){
        let direction = -2;
        if(this.usingMultiple){
            //this.suggestionBox.innerHTML = `Suggestion[${this.usingMultiple ? "M" : "S"}]: Calculating`;
            direction = this.getSuggestionMultiple();
        } else {
            direction = this.getSuggestionSingle();
        }

        if(direction < 0) console.error(`internal error in displayPanel.getSuggestion()`);
        this.updateSuggestion(direction);
    }

    updateSuggestion(direction: types.DIRECTION_CODE | number){
        if(0 <= direction && direction <= 3) this.suggestionBox.innerHTML = `Suggestion[${this.usingMultiple ? "M" : "S"}]: ${displayPanel.directionMap[direction as types.DIRECTION_CODE]}`;
        else {
            this.suggestionBox.innerHTML = `Suggestion[${this.usingMultiple ? "M" : "S"}]: ⚠️`;
        }
    }

    setAutoUpdateSuggestion(){ // automatically update the suggestions
        document.onkeyup = (e) => {setTimeout(() => this.getSuggestion(), 200);};
        document.ontouchmove = (e) => {setTimeout(() => this.getSuggestion(), 200);};
    }
}

export namespace displayPanel {
    export const recommandedMAXLimit = 8;

    export let directionMap = {
        [types.DIRECTION_CODE.UPWARD]: "↑",
        [types.DIRECTION_CODE.DOWNWARD]: "↓",
        [types.DIRECTION_CODE.LEFT]: "←",
        [types.DIRECTION_CODE.RIGHT]: "→",
    }

    export function createRadioInput(name: string, description: string): {
        container: HTMLElement,
        input: HTMLInputElement
    }{
        let container = document.createElement("div");
        let switchInput = document.createElement("input");
        let label = document.createElement("label");
        
        switchInput.type = "radio";
        switchInput.name = "2048modeSwich";
        switchInput.id = name;

        label.setAttribute("for", name);
        label.innerHTML = description;

        container.appendChild(switchInput);
        container.appendChild(label);

        return {
            container: container,
            input: switchInput
        }
    }
}

(window as any)["displayPanel"] = displayPanel;