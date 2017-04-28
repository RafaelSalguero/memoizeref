import memoize = require("./index");
import moize = require("moize");

import bench = require("benchmark");

const fibRef = memoize((n: number, b: boolean) => {
    switch (n) {
        case 0: return 0;
        case 1: return 1;
        default: return fibRef(n - 1) + fibRef(n - 2);
    }
}, Number.POSITIVE_INFINITY);

const fibMoize = moize((n: number, b: boolean) => {
    switch (n) {
        case 0: return 0;
        case 1: return 1;
        default: return fibMoize(n - 1) + fibMoize(n - 2);
    }
});

const param = 35;
const suite = new bench.Suite;
suite.add("memoize ref", () => {
    fibRef(param, true);
});

suite.add("moize", () => {
    fibMoize(param, true);
});

suite.on('cycle', function (event) {
    console.log(String(event.target));
})
suite.run();