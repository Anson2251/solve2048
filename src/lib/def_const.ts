import types from "./def_type";

export namespace consts {
    export const CONTAINER_CSS_PATH = ".tile-container";
    export const SCORE_CSS_PATH = "html body div.container div.heading div.scores-container div.score-container";
    export const CSS_CLASS_MATCH = /tile-position-[0-9]-[0-9]/g;

    export const MAP_HEIGHT = 4;
    export const MAP_WIDTH = 4;

    export const INITIAL_WEIGHT: types.weights = {
        combine: 16,
        feasibleDirection: 4,
        borderDecision: {
            this: 0,
            side: 2,
            opposite: 1
        }
    }
}

export default consts;