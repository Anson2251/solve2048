// test - multiple decision
// depend on nodejs

import solver from "../lib/solver";
import simulationMap from "../lib/simulationMap";
import consts from "../lib/def_const";
import types from "../lib/def_type";
import { timeEnd } from "console";

const TEST_NUMBER = 200;
const DEPTH_LIMIT = 5;

function clear() {
    console.clear()
}

function printMap(map: number[][]) {
    for (let row of map) {
        console.log(row);
    }
}

let SMap = new simulationMap();


function solve2048_decision_useMultiple(SMap: simulationMap, callback_afterDecision?: Function) {
    let scoreToltal = 0;
    let solve = new solver();
    let result: ReturnType<(simulationMap["move"])>;
    let flag_gameOver = false;
    const RANDOM_FILL = true;

    do {
        solve.importMapFromSimulationMap(SMap);
        let aiChoice = solve.decisionMaker_multiple(DEPTH_LIMIT);
        if (aiChoice >= 0) {
            result = SMap.move(aiChoice, RANDOM_FILL);
            scoreToltal += result.score;
            flag_gameOver = result.gameover;
        }else{
            flag_gameOver = true;
            return -1;
        }

        if (!flag_gameOver && callback_afterDecision) callback_afterDecision(SMap, scoreToltal);
    }
    while (!flag_gameOver);

    return scoreToltal;
}

clear();
console.log("press any key to start")

let resultSolver = solve2048_decision_useMultiple(SMap, (map: simulationMap, score: number) => {
    clear();
    console.log(score);
})

clear();
printMap(SMap.getMap());
console.log(`score: ${resultSolver}`);
if(resultSolver <= 0){
    console.log("algorithm error, invalid (meaningless) operation");
}
console.log("game over");

// generate test statistics

let totalScore = 0;
let errorNumber = 0;

console.log(`running test [0/${TEST_NUMBER}]`);

let recordScore = new Array(TEST_NUMBER);
let startTime = (new Date()).getTime();

for(let i = 0; i < TEST_NUMBER; i++){
    let score = 0;
    let map = new simulationMap();

    do{
        score = solve2048_decision_useMultiple(map);
        if(!map.isFullMap()) {
            errorNumber++;
            map = new simulationMap();
        }
    }
    while(!map.isFullMap());

    totalScore += score;
    console.log(`test [${i+1}/${TEST_NUMBER}] (${Math.round((i+1)/TEST_NUMBER*100)}%), score: ${score}`);
    recordScore[i] = score;
}

let endTime = (new Date()).getTime();

console.log(`average score: ${Math.round(totalScore/TEST_NUMBER)}`);
console.log(`max score: ${Math.max(...recordScore)}`);
console.log(`min score: ${Math.min(...recordScore)}`);
console.log(`crash number: ${errorNumber} (${Math.round(errorNumber / TEST_NUMBER * 100)}%)`);
console.log(`time cost: ${(endTime - startTime)/1000}s`);
console.log(`speed: ${Math.round((endTime - startTime)/(TEST_NUMBER + errorNumber))}ms/t`)
