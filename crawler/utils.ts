import { dirname, join, extname } from "path";
import slug from "slug";
import * as cheerio from "cheerio";
import { readFile, mkdir, writeFile } from "fs";
import superagent from "superagent";

export function urlToFilename(url: string) {
  const parsedUrl = new URL(url);
  const urlPath = parsedUrl.pathname
    .split("/")
    .filter(function (component) {
      return component !== "";
    })
    .map(function (component) {
      return slug(component, { remove: null });
    })
    .join("/");
  let filename = join(parsedUrl.hostname, urlPath);
  if (!extname(filename).match(/htm/)) {
    filename += "/index.html";
  }

  return filename;
}

export function getPageLinks(currentUrl: string, html: string) {
  const $ = cheerio.load(html);
  const out = Array.from($("a"))
    .map((e) => {
      const curr = new URL(currentUrl);
      const next = new URL(e.attribs.href || "", currentUrl);
      if (curr.hostname !== next.hostname || !next.pathname) return null;
      return next.toString();
    })
    .filter(Boolean);
  return out as string[];
}

export function checkFileCache(
  filepath: string,
  callback: (err: Error | null, data?: string) => void,
) {
  readFile(filepath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return callback(null);
      }
      return callback(err);
    }
    return callback(null, data);
  });
}

export function getHtml(
  url: string,
  callback: (err: Error | null, data?: string) => void,
) {
  return superagent.get(url, (err, res) => {
    if (err) {
      return callback(err);
    }
    if (!res.text) {
      return callback(new Error(`No data at: ${url}`));
    }
    return callback(null, res.text);
  });
}

export function write(
  filepath: string,
  data: string,
  callback: (err: Error | null) => void,
) {
  return mkdir(dirname(filepath), { recursive: true }, (err) => {
    if (err) {
      return callback(err);
    }
    writeFile(filepath, data, (err) => {
      if (err) {
        return callback(err);
      }

      callback(null);
    });
  });
}
