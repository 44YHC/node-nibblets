import { EventEmitter } from "events";
import { readFile } from "fs";

class FindRegex extends EventEmitter {
  private regex: RegExp;
  private files: string[];
  constructor(regex: RegExp) {
    super();
    this.regex = regex;
    this.files = [];
  }

  addFile(filepath: string) {
    this.files.push(filepath);
    return this;
  }

  find() {
    process.nextTick(() => this.emit("searching", this.files));
    for (const filepath of this.files) {
      readFile(filepath, "utf8", (err, data) => {
        if (err) {
          return this.emit("error", err);
        }
        this.emit("fileread", filepath);
        const match = data.match(this.regex);
        if (match) {
          match.forEach((m) => this.emit("found", filepath, m));
        }
      });
    }
    return this;
  }
}

const fre = new FindRegex(/test/gi);
fre
  .on("error", (err) => console.error(err))
  .on("searching", (data) =>
    console.log(`searching .... ${JSON.stringify(data)}`),
  )
  .on("fileread", (file) => console.log(`file read: ${file}`))
  .on("found", (file, match) =>
    console.log(`Found match: ${match} in file: ${file}`),
  )
  .addFile("./a.txt")
  .addFile("./b.txt")
  .find();
