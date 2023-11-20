import types from "./def_type";
import consts from "./def_const";
import gameMap from "./gameMap";
import simulationMap from "./simulationMap";

export namespace strategies{
    export function keepMaxInCorner(map: gameMap | simulationMap){
        // only support size 4

        let oldMap;

        let mat = [[0, 0], [0, 0]]

        for(let y = 0; y < 4/*consts.MAP_HEIGHT*/; y++){
            for(let x = 0; x < 4/*consts.MAP_WIDTH*/; x++){
                mat[Math.floor(y/2)][Math.floor(x/2)] += map.getVal(x, y);
            }
        }

        let maxValPos = [mat[0][0], mat[1][0], mat[1][1], mat[0][1]].indexOf(Math.max(...(mat[0].concat(mat[1]))));
        // 0  3
        // 1  2

        do{
            map.move(maxValPos);
            map.move((maxValPos + 1) % 4);

            oldMap = map.getMap();
        }
        while(!map.isSameMap(oldMap))
    }
}

export default strategies
