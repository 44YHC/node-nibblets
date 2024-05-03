import { lstat, readdir } from "fs";
import { join } from "path";
import { EventEmitter } from "events";

function recreaddir(
  path: string,
  ee: EventEmitter,
  callback: (err: Error | null) => void,
) {
  lstat(path, (err, stats) => {
    if (err) {
      ee.emit("error", path);
      return callback(err);
    }
    if (stats.isFile()) {
      return ee.emit("fileFound", path);
    }

    readdir(path, (err, files) => {
      if (err) {
        ee.emit("error", path);
        return callback(err);
      }

      for (const file of files) {
        const filepath = join(path, file);
        recreaddir(filepath, ee, callback);
      }
    });
  });
}

recreaddir(
  "./test",
  new EventEmitter()
    .on("error", (path) => console.log(`error in ${path}`))
    .on("fileFound", (path) => console.log(`found file: ${path}`)),
  (err) => {
    if (err) {
      console.error(err);
    }
  },
);
