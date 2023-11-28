// write a function to deep clone an object

const TEST_MAXIMUM = 1000000;

function getCurrentTimeMS(){
    return (new Date()).getTime();
}

function deepClone(obj: any){
    let col = obj.length;
    let row = obj[0].length;
    let newObj: any = new Array(col).fill(0).map((v: any, i: number) => (
        new Array(row).fill(0).map((v: any, j: number) => obj[i][j]
        )
    ));

    return newObj;
    // for(let key of obj.keys()){
    //     newObj[key] = typeof obj[key] === 'object' ? deepClone(obj[key]) : obj[key];
    // }
    // return newObj;
}



function deepClone_json(obj: any){
    return JSON.parse(JSON.stringify(obj));
}

function benchmark(){
    let a =  [[1, 2], [3, 4]];

    let startTimeJson = getCurrentTimeMS();
    // test json
    for(let i = 0; i < TEST_MAXIMUM; i++){
        a[0][0] = i;
        deepClone_json(a);
    }
    let finalTimeJson = getCurrentTimeMS();

    let startTimeNew = getCurrentTimeMS();
    // test new algorithm
    for(let i = 0; i < TEST_MAXIMUM; i++){
        a[0][0] = i;
        deepClone(a);
    }
    let finalTimeNew = getCurrentTimeMS();

    console.log(`json: ${finalTimeJson - startTimeJson}, new: ${finalTimeNew - startTimeNew}`);
}

let a = [[1, 2], [3, 4], [7, 8]]
let b = deepClone_json(a);

let c = deepClone(a);

a[0][0] = 5;

if(JSON.stringify(b) === JSON.stringify(c)){
    benchmark();
}else{
    console.log("fail to deep clone the object")
    console.log(JSON.stringify(b));
    console.log(JSON.stringify(c));
}

