import { lstat, readFile, readdir } from "fs";
import { join } from "path";
function recursiveFind(
  path: string,
  keyword: string,
  callback: (err: Error | null, data?: string[]) => void,
) {
  const output: string[] = [];
  let running = 0;

  function find(path: string, innerCb: (err: Error | null) => void) {
    readFile(path, "utf8", (err, data) => {
      if (err) {
        return innerCb(err);
      }
      if (new RegExp(keyword).test(data)) {
        output.push(path);
      }
      innerCb(null);
    });
  }

  function iterate(path: string, innerCb: (err: Error | null) => void) {
    running++;
    lstat(path, (err, stats) => {
      if (err) {
        return innerCb(err);
      }
      if (stats.isFile()) {
        return find(path, (err) => {
          if (err) {
            return innerCb(err);
          }
          return innerCb(null);
        });
      }

      readdir(path, (err, files) => {
        if (err) {
          return innerCb(err);
        }
        for (const file of files) {
          const filepath = join(path, file);
          iterate(filepath, innerCb);
        }
        return process.nextTick(() => innerCb(null));
      });
    });
  }

  iterate(path, (err) => {
    if (err) {
      return callback(err);
    }
    running--;
    if (running === 0) {
      return callback(null, output);
    }
  });
}

recursiveFind("./test", "batman", (err: Error | null, data?: string[]) => {
  if (err) {
    return console.error(err);
  }
  console.log(data);
});
