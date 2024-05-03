function promiseall<T>(promises: Promise<T>[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const out: T[] = [];
    let total = promises.length;
    let done = 0;
    for (const i in promises) {
      promises[i]
        .then((value) => {
          out[i] = value;
          done++;
          if (done === total) {
            resolve(out);
          }
        })
        .catch((err) => reject(err));
    }
  });
}

function p(): Promise<number> {
  return new Promise((resolve, reject) => {
    const delay = Math.floor(Math.random() * 1000);
    setTimeout(() => {
      if (Math.random() >= 0.9) {
        reject(delay);
      }
      resolve(delay);
    }, delay);
  });
}
promiseall<number>([p(), p(), p(), p(), p()])
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
