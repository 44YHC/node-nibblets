import { readFile, writeFile } from "fs";

function concat(...args: [(e: Error | null) => void, string, ...string[]]) {
  const [cb, dest, ...files] = args;
  let output = "";
  function iterate(index: number) {
    if (index === files.length) {
      return writeFile(dest, output, (err) => {
        if (err) {
          return cb(err);
        }
        return cb(null);
      });
    }
    const filepath = files[index];
    readFile(filepath, "utf8", (err, data) => {
      if (err) {
        return cb(err);
      }
      output += data;
      return iterate(index + 1);
    });
  }
  iterate(0);
}

concat(
  (e) => {
    if (e) {
      return console.error(e);
    }
    console.log("finished");
  },
  "dest.txt",
  "a.txt",
  "b.txt",
  "c.txt",
);
