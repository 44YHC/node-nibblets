import { readFile, writeFile } from "fs";

function concat(
  callback: (e: Error | null) => void,
  destination: string,
  ...files: string[]
) {
  let output = "";
  function iterate(index: number) {
    if (index === files.length) {
      return writeFile(destination, output, (err) => {
        if (err) {
          return callback(err);
        }
        return callback(null);
      });
    }
    const filepath = files[index];
    readFile(filepath, "utf8", (err, data) => {
      if (err) {
        return callback(err);
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
