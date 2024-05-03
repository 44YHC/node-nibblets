import {
  getPageLinks,
  urlToFilename,
  checkFileCache,
  getHtml,
  write,
} from "./utils.js";

export function crawl(
  url: string,
  depth: number,
  cache: Set<string>,
  callback: (err: Error | null) => void,
) {
  const filepath = urlToFilename(url);

  if (cache.has(filepath)) {
    return process.nextTick(() => callback(null));
  }
  cache.add(filepath);

  console.log(`crawling: ${url}`);
  checkFileCache(filepath, (err, html) => {
    if (err) {
      return callback(err);
    }

    if (html) {
      return crawlLinks(url, html, depth - 1, cache, (err) => {
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    }

    getHtml(url, (err, html) => {
      if (err) {
        return callback(err);
      }

      return write(filepath, html!, (err) => {
        if (err) {
          return callback(err);
        }
        return crawlLinks(url, html!, depth - 1, cache, (err) => {
          if (err) {
            return callback(err);
          }
          return callback(null);
        });
      });
    });
  });
}

function crawlLinks(
  currentUrl: string,
  html: string,
  depth: number,
  cache: Set<string>,
  callback: (err: Error | null) => void,
) {
  if (depth <= 0) {
    return process.nextTick(() => callback(null));
  }

  const links = getPageLinks(currentUrl, html);

  if (links.length === 0) {
    return process.nextTick(() => callback(null));
  }

  const concurrency = 1;
  let completed = 0;
  let running = 0;

  function next() {
    while (running < concurrency && links.length) {
      crawl(links.shift()!, depth, cache, (err) => {
        if (err) {
          return callback(err);
        }
        if (++completed === links.length) {
          return callback(null);
        }
        running--;
        next();
      });
      running++;
    }
  }

  next();

  // for (const link of links) {
  //   crawl(link, depth - 1, cache, (err) => {
  //     if (err) {
  //       return callback(err);
  //     }
  //     if (++completed === links.length) return callback(null);
  //   });
  // }
  //
  //
  // function iterate(index: number) {
  //   if (index === links.length) {
  //     return process.nextTick(() => callback(null));
  //   }
  //   crawl(links[index], depth - 1, cache, (err) => {
  //     if (err) {
  //       return callback(err);
  //     }
  //     return iterate(index + 1);
  //   });
  // }
  //
  // iterate(0);
}

crawl("https://nextjs.org/", 2, new Set<string>(), (err) => {
  if (err) {
    return console.error(err);
  }
  console.log("done");
});
