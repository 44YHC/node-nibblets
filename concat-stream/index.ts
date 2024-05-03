import { createReadStream, createWriteStream } from "fs";
import { Readable, Transform } from "stream";

export function concat(destination: string, files: string[]) {
  return new Promise<void>((resolve, reject) => {
    const writeStream = createWriteStream(destination);
    Readable.from(files)
      .pipe(
        new Transform({
          objectMode: true,
          transform(filename, _, callback) {
            const readStream = createReadStream(filename);
            readStream.pipe(writeStream, { end: false });
            readStream.on("error", callback);
            readStream.on("end", callback);
          },
        }),
      )
      .on("error", reject)
      .on("finish", () => {
        writeStream.end();
        resolve();
      });
  });
}

concat("out.txt", ["a.txt", "b.txt", "c.txt"]);
