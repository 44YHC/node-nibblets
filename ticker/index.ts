import { EventEmitter } from "events";

function ticker(ms: number, cb: (e: Error | null, c: number | null) => void) {
  const e = new EventEmitter();
  e.emit("tick");
  rt(ms, 0, e, cb);
  return e;
}

function rt(
  ms: number,
  count: number,
  e: EventEmitter,
  cb: (e: Error | null, c: number | null) => void,
) {
  if (ms <= 0) return cb(null, count);
  setTimeout(() => {
    if (Date.now() % 5 === 0) {
      e.emit("error", new Error("error42"));
      return cb(new Error("error42"), null);
    }
    e.emit("tick");
    rt(ms - 50, count + 1, e, cb);
  }, 50);
}

ticker(500, (error, count) => {
  if (error) {
    return console.error(error);
  }
  console.log(count);
})
  .on("tick", () => console.log("tick"))
  .on("error", () => console.log("error happened"));
