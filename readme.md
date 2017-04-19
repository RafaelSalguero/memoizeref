# memoizeref

Memoizer that compare arguments by *reference*. Useful for:
- **Immutable values** (only reference is compared thus faster)
- **Functions as argumnets** (functions can be compared by reference, memoizers that use string comparission doesn't support functions as arguments)


### Function definition
```ts
function memoize(func, maxDepth? : number) { ... }

//func - The function to memoize
//maxDepth Max number of results to store in cache. Default is 5
```

### Example
```ts
import { memoize } from "memoizeref"
function sum(a,b) {
    return a + b;
}

const mem = memoize(sum);

//3
mem(1,2);
//3 (from cache)
mem(1,2);

```

## Example with functions as arguments
```ts
import { memoize } from "memoizeref"

//A function that takes another function as argument
const filter = (items, predicate) => {
    return items.filter(predicate);
}

const filterMemo = memoize(filter);

const array = [1,2,3];
const greaterThan2 = x => x > 2;
const equals1 = x => x == 1;

filterMemo(array, greaterThan2);
//memoized value returned here:
filterMemo(array, greaterThan2);

//function reference changed, filter is called
filterMemo(array, equals1);
//memoized value returned:
filterMemo(array, equals1);
```