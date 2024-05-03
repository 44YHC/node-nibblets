import EventEmitter from "events";
import {
  getPageLinks,
  urlToFilename,
  checkFileCache,
  getHtml,
  write,
} from "./utils.js";

export class Queue extends EventEmitter {
  private concurrency: number;
  private running: number;
  private queue: ((innerCb: (err: Error | null) => void) => void)[];

  constructor(concurrency: number) {
    super();
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }
  pushTask(task: (innerCb: (err: Error | null) => void) => void) {
    this.emit("pushed");
    this.queue.push(task);
    process.nextTick(this.next.bind(this));
    return this;
  }
  next() {
    if (this.running === 0 && this.queue.length === 0) {
      return this.emit("empty");
    }
    while (this.running < this.concurrency && this.queue.length) {
      const task = this.queue.shift()!;
      task((err: Error | null) => {
        if (err) {
          this.emit("error", err);
        }
        this.emit("done");
        this.running--;
        process.nextTick(this.next.bind(this));
      });
      this.running++;
    }
  }
}

function crawler(url: string, depth: number, queue: Queue, cache: Set<string>) {
  const filepath = urlToFilename(url);
  if (cache.has(filepath)) return;
  cache.add(filepath);

  console.log(`added: ${url}`);
  queue.pushTask((innerCb: (err: Error | null) => void) => {
    crawl(filepath, url, depth, queue, cache, innerCb);
  });
}

function crawl(
  filepath: string,
  url: string,
  depth: number,
  queue: Queue,
  cache: Set<string>,
  callback: (err: Error | null) => void,
) {
  checkFileCache(filepath, (err, html) => {
    if (err) {
      return callback(err);
    }

    if (html) {
      crawlLinks(url, html, depth, queue, cache);
      return callback(null);
    }

    getHtml(url, (err, html) => {
      if (err) {
        return callback(err);
      }

      return write(filepath, html!, (err) => {
        if (err) {
          return callback(err);
        }
        crawlLinks(url, html!, depth, queue, cache);
        return callback(null);
      });
    });
  });
}

function crawlLinks(
  currentUrl: string,
  html: string,
  depth: number,
  queue: Queue,
  cache: Set<string>,
) {
  if (depth === 0) return;
  const links = getPageLinks(currentUrl, html);
  if (links.length === 0) return;
  for (const link of links) {
    crawler(link, depth - 1, queue, cache);
  }
}

crawler(
  "https://nextjs.org/",
  1,
  new Queue(5)
    .on("empty", () => console.log("Finished"))
    .on("error", (err) => console.error(err)),
  new Set<string>(),
);
