function squarePromise(val: number) {
  return new Promise<number>((resolve, reject) => {
    setTimeout(() => {
      resolve(val * val);
    }, 100);
  });
}

function parallelMapWithConcurrency<T, U>(
  iterable: T[],
  mapper: (arg: T) => Promise<U>,
  concurrency: number,
) {
  return new Promise((resolve, reject) => {
    const iterableCopy = [...iterable];
    let running = 0;
    const output: U[] = [];
    const errors: Error[] = [];
    function next() {
      if (running === 0 && iterableCopy.length === 0) {
        if (errors.length > 0) {
          reject(errors);
        }
        resolve(output);
      }
      while (running < concurrency && iterableCopy.length > 0) {
        const item = iterableCopy.shift();
        mapper(item as T)
          .then((data) => {
            output.push(data);
          })
          .catch((err) => {
            errors.push(err);
          })
          .finally(() => {
            running--;
            next();
          });
        running++;
      }
    }
    next();
  });
}

const promises = parallelMapWithConcurrency<number, number>(
  [1, 2, 3, 4, 5],
  squarePromise,
  2,
)
  .then((data) => console.log(data))
  .catch((errors) => console.log(errors));
