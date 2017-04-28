import memoize = require("./index");

interface memoizeMap {
    getResult(args: any[], func: (...args) => any);
    instanceMapCount : number;
    resultMapCount : number;
}
const createMap = (maxDepth: number) => {
    const r = memoize(null!, maxDepth) as any;
    return r.mapInstance as memoizeMap;
}

test("Function returns the same result", () => {
    const suma = (a: number, b: number) => a + b;
    const mem = memoize(suma);

    expect(mem(1, 2)).toBe(3);
    expect(mem(1, 2)).toBe(3);

    expect(mem(3, 2)).toBe(5);

});
test("Function returns same array", () => {

    const a1 = [1, 2, 3, 4, 5, 6];
    const a2 = [8, 9, 10];
    const func = (a: number[]) => a.filter(x => x % 2 == 0);

    //Function doesn't return the same array both times
    expect(func(a1)).not.toBe(func(a1));

    const memo = memoize(func);

    //Memo returns the same array:
    expect(memo(a1)).toBe(memo(a1));
    expect(memo(a2)).toBe(memo(a2));
});

test("Function memoize function argument", () => {
    const a1 = [1, 2, 3, 4, 5, 6];
    const a2 = [8, 9, 10, 4, 5];

    const pred1 = x => x > 5;
    const pred2 = x => x == 4;

    const func = (arr: number[], pred: (x: number) => boolean) => arr.filter(x => pred(x));

    const memo = memoize(func);
    expect(memo(a1, pred1)).toBe(memo(a1, pred1));
    expect(memo(a1, pred2)).toBe(memo(a1, pred2));

    expect(memo(a1, pred1)).not.toBe(memo(a1, pred2));

    expect(memo(a1, pred1)).toBe(memo(a1, pred1));
    expect(memo(a1, pred2)).toBe(memo(a1, pred2));
});

test("Memoize depth", () => {
    const a1 = [1, 2, 3, 4, 5, 6];
    const a2 = [8, 9, 10];
    const a3 = [8, 9, 10];
    const a4 = [8, 9, 10];
    const func = (a: number[]) => a.filter(x => x % 2 == 0);

    const memo = memoize(func, 2);

    const r = {
        0: memo(a1),
        1: memo(a1),
        2: memo(a2),
        3: memo(a3), //a1 has been forgetted
        4: memo(a1),
        5: memo(a3), //a2 has been forgetted
        6: memo(a2),
        7: memo(a2),
        8: memo(a3),
        9: memo(a3),
    };

    expect(r[0]).toBe(r[1]); //a1
    expect(r[1]).not.toBe(r[4]); //a1

    expect(r[3]).toBe(r[5]);  //a3
    expect(r[2]).not.toBe(r[6]); //a2
    expect(r[6]).toBe(r[7]); //a2
    expect(r[8]).toBe(r[9]); //a3

});

test("Memoize memory depth", () => {
    const func = (a, b) => { };
    const map = createMap(2);

    //The map starts empty
    expect(map.instanceMapCount).toBe(0);
    expect(map.resultMapCount).toBe(0);

    map.getResult([1, 2], func);

    expect(map.instanceMapCount).toBe(2); //1, 2
    expect(map.resultMapCount).toBe(1); //(1, 2)

    map.getResult([1, 2], func);

    expect(map.instanceMapCount).toBe(2); //1, 2
    expect(map.resultMapCount).toBe(1); //(1, 2)

    map.getResult([3, 2], func);

    expect(map.instanceMapCount).toBe(3); //1, 2, 3
    expect(map.resultMapCount).toBe(2); //(1, 2), (3, 2)

    map.getResult([3, 5], func);

    expect(map.instanceMapCount).toBe(3); //1, 3, 5
    expect(map.resultMapCount).toBe(2); //(3, 2), (3, 5)

    map.getResult([7, 8], func);

    expect(map.instanceMapCount).toBe(4); //3, 5, 7, 8
    expect(map.resultMapCount).toBe(2); //(3, 5), (7, 8)

    map.getResult([8, 7], func);

    expect(map.instanceMapCount).toBe(2); //7, 8
    expect(map.resultMapCount).toBe(2); //(7, 8), (8, 7)

    map.getResult([1, 2], func);

    expect(map.instanceMapCount).toBe(4); //7, 8, 1, 2
    expect(map.resultMapCount).toBe(2); //(8, 7), (1, 2)

    map.getResult([3, 4], func);

    expect(map.instanceMapCount).toBe(4); //1, 2, 3, 4
    expect(map.resultMapCount).toBe(2); //(1, 2), (3, 4)
});

test("Memoize memory depth 1000 calls", () => {
    const func = (a, b) => a + b;
    const map = createMap(2);

    //1000 calls 
    for (var i = 0; i < 1000; i++) {
        map.getResult([Math.random(), Math.random()], func);
    }

    //There are no more than 4 different arguments and 2 results stored on the map
    expect(map.instanceMapCount).toBeLessThanOrEqual(4);
    expect(map.resultMapCount).toBe(2);
});