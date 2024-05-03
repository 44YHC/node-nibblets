function fibiterator(max: number) {
  let current = 0;
  let next = 1;

  return {
    [Symbol.iterator]() {
      return {
        next() {
          if (current <= max) {
            let done = false;
            let value = current;
            [current, next] = [next, current + next];
            return {
              done,
              value,
            };
          }
          return {
            done: true,
          };
        },
      };
    },
  };
}

const i = fibiterator(100);
for (const v of i) {
  console.log(v);
}

class Fibiterator {
  private current = 0;
  private next = 1;
  private max: number;

  constructor(max: number) {
    this.max = max;
  }

  [Symbol.iterator]() {
    return {
      next: () => {
        // the arrow function inherits the class instance's `this` reference
        if (this.current <= this.max) {
          let done = false;
          let value: number = this.current;
          [this.current, this.next] = [this.next, this.current + this.next];
          return {
            done,
            value,
          };
        }
        return {
          done: true,
        };
      },
    };
  }
}

const I = new Fibiterator(100);
for (const v of I) {
  console.log(v);
}

class AsyncFibIterator {
  private current = 0;
  private next = 1;
  private max: number;

  constructor(max: number) {
    this.max = max;
  }

  [Symbol.asyncIterator]() {
    return {
      next: () => {
        if (this.current <= this.max) {
          let done = false;
          let value: number = this.current;
          [this.current, this.next] = [this.next, this.current + this.next];
          return new Promise<{ done: boolean; value: number }>((resolve) => {
            setTimeout(() => resolve({ done, value }), 100);
          });
        }
        return new Promise<{ done: boolean; value: undefined }>((resolve) =>
          setTimeout(
            () =>
              resolve({
                done: true,
                value: undefined,
              }),
            100,
          ),
        );
      },
    };
  }
}

const A = new AsyncFibIterator(100);
(async () => {
  for await (const v of A) {
    console.log(v);
  }
})();

class Fibgenerator {
  private current = 0;
  private next = 1;
  private max: number;

  constructor(max: number) {
    this.max = max;
  }

  *[Symbol.iterator]() {
    while (this.current <= this.max) {
      const value = this.current;
      [this.current, this.next] = [this.next, this.current + this.next];
      yield value;
    }
  }
}

const G = new Fibgenerator(100);
for (const v of G) {
  console.log(v);
}

class AsyncFibgenerator {
  private current = 0;
  private next = 1;
  private max: number;

  constructor(max: number) {
    this.max = max;
  }

  async *[Symbol.asyncIterator]() {
    while (this.current <= this.max) {
      const value = this.current;
      [this.current, this.next] = [this.next, this.current + this.next];
      yield new Promise((resolve) => {
        setTimeout(() => resolve(value), 100);
      });
    }
  }
}

const AG = new AsyncFibgenerator(100);
(async () => {
  for await (const v of AG) {
    console.log(v);
  }
})();
