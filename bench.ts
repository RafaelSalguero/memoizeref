import memoize = require("./index");
import moize = require("moize");

import bench = require("benchmark");

const largeArray: number[] = [];
for (var i = 0; i < 100000; i++) {
    largeArray.push(Math.random());
}

const func = (arr : number[]) => arr.reduce((a,b)=> a + b, 0);

const ref = memoize(func);

const fibMoize = moize(func);

const param = largeArray;
const suite = new bench.Suite;
suite.add("memoize ref", () => {
    ref(param);
});

suite.add("moize", () => {
    fibMoize(param);
});

suite.on('cycle', function (event) {
    console.log(String(event.target));
})
suite.run();