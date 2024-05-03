import superagent from "superagent";
import EventEmitter from "events";
import { getPageLinks, urlToFilename } from "./utils.js";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

class Queue extends EventEmitter {
  private concurrency: number;
  private running: number;
  private queue: (() => Promise<void>)[];

  constructor(concurrency: number) {
    super();
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }
  next() {
    if (this.running === 0 && this.queue.length === 0) {
      return this.emit("empty");
    }
    while (this.running < this.concurrency && this.queue.length) {
      const task = this.queue.shift()!;
      task().finally(() => {
        this.running--;
        this.next();
      });
      this.running++;
    }
  }

  push(task: () => Promise<void>) {
    return new Promise((resolve, reject) => {
      this.queue.push(() => {
        return task().then(resolve, reject);
      });
      process.nextTick(this.next.bind(this));
    });
  }
}

function download(url: string, filepath: string) {
  return superagent
    .get(url)
    .then((response) =>
      mkdir(dirname(filepath), { recursive: true }).then(() =>
        writeFile(filepath, response.text).then(() => response.text),
      ),
    );
}

function crawlLinks(
  url: string,
  html: string,
  depth: number,
  queue: Queue,
  cache: Set<string>,
) {
  if (depth === 0) return Promise.resolve();
  const links = getPageLinks(url, html);
  return Promise.all(links.map((link) => crawl(link, depth, queue, cache)));
}

function crawl(url: string, depth: number, queue: Queue, cache: Set<string>) {
  const filepath = urlToFilename(url);
  if (cache.has(filepath)) return Promise.resolve();
  cache.add(filepath);
  return queue.push(() =>
    readFile(filepath, "utf8")
      .catch((err) => {
        if (err.code !== "ENOENT") throw err;
        queue.emit("added", url);
        return download(url, filepath);
      })
      .catch((err) => {
        queue.emit("error", err);
        return Promise.resolve();
      })
      .then((html) => {
        if (!html) return Promise.resolve();
        crawlLinks(url, html, depth - 1, queue, cache);
      }),
  );
}

crawl(
  "https://nextjs.org",
  2,
  new Queue(2)
    .on("empty", () => console.log("finished"))
    .on("error", (err) => console.error(err))
    .on("added", (url) => console.log(`added ${url}`)),
  new Set<string>(),
);
