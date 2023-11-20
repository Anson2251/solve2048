function random(min: number, max: number){
    return Math.floor(Math.random() * 10 * max) % (max - min) + min;
}

function printTable(map: any, func: Function){
    let keys = Object.keys(map);
    for(let key of keys){
        console.log(func(key, map[key]));
    }
}

let map: any = {};
const MAX_NUM = 100000000;

for(let i = 0; i < MAX_NUM; i++){
    let rand = random(-5, 5).toString();
    if(map[rand]) map[rand]++;
    else map[rand] = 1;
}

printTable(map, (key: string, val: number) => {
    return `${key}: ${Math.round(val/MAX_NUM*10000)/100}%`
});
