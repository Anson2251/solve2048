export namespace types {
    export interface weights {
        combine: number;
        feasibleDirection: number;
        borderDecision: {
            this: number;
            side: number;
            opposite: number;
        }
    }

    export type map2048 = number[][];
    /**[`up`, `left`, `down`, `right`]*/
    export type directionsArray = [number, number, number, number];
    /**[`horizontal`, `vertical`]*/
    export type VerticalHorizontal_Array = [number, number];

    /**code for each direction */
    export const enum DIRECTION_CODE {
        UPWARD = 0,
        LEFT = 1,
        DOWNWARD = 2,
        RIGHT = 3
    } 

    /* ^ used to beUPWARD = 0,
        LEFT = 1,
        DOWNWARD = 2,
        RIGHT = 3

    */

    /**code for vertical-horizontal diretion*/
    export const enum VRTCL_HRZNTL_DIRECTION_CODE {
        VERTICAL = 0,
        HORIZONTAL = 1
    }
}

export default types;