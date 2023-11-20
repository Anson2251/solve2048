// depend on nodejs

import simulationMap from "../lib/simulationMap";
import types from "../lib/def_type";
import solver from "../lib/solver";

import readline from "readline";

let flag_gameOver = false;
let score = 0;
let engine = new solver();

function clear() {
    console.clear()
}

function printMap(map: number[][]) {
    for (let row of map) {
        console.log(row);
    }
    console.log("");
}

let SMap = new simulationMap();

readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
    if (key.ctrl === true && (key.name === 'd' || key.name === 'c')) {
        process.exit(0)
    }

    let result: ReturnType<(simulationMap["move"])>;

    if (!flag_gameOver) {
        if (key.name === 'a') {
            result = SMap.move(types.DIRECTION_CODE.LEFT);
        } else if (key.name === 'd') {
            result = SMap.move(types.DIRECTION_CODE.RIGHT);
        } else if (key.name === 'w') {
            result = SMap.move(types.DIRECTION_CODE.UPWARD);
        } else if (key.name === 's') {
            result = SMap.move(types.DIRECTION_CODE.DOWNWARD);
        } else {
            return;
        }

        score += result.score;

        clear();
        printMap(SMap.getMap());
        console.log(`score :${score}`)

        engine.importMapFromSimulationMap(SMap);
        let aiChoice = engine.decisionMaker_multiple(4);
        if(aiChoice >= 0) console.log(`AI's Choice: ${['w', 'a', 's', 'd'][aiChoice]}`);
    } else {
        clear();
        printMap(SMap.getMap());
        console.log("game over");
        flag_gameOver = true;
        process.exit(0);
    }

    flag_gameOver = result.gameover;
})

clear();
console.log("press any key to start")