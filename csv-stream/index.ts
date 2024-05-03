import csvParser from "csv-parser";
import { createReadStream } from "fs";
import { PassThrough, TransformOptions, TransformCallback } from "stream";
import { pipeline } from "stream";

type Year = 2008 | 2009 | 2010 | 2011 | 2012 | 2013 | 2014 | 2015 | 2016;

interface RowChunk {
  lsoa_code: string;
  borough: string;
  major_category: string;
  minor_Category: string;
  value: number;
  year: Year;
  month: number;
}

class ReportsByYear extends PassThrough {
  private rby: Record<Year, number> = {
    2008: 0,
    2009: 0,
    2010: 0,
    2011: 0,
    2012: 0,
    2013: 0,
    2014: 0,
    2015: 0,
    2016: 0,
  };

  constructor(options: TransformOptions = {}) {
    super({ ...options, objectMode: true });
  }

  _transform(
    chunk: RowChunk,
    _: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.rby[chunk.year] += Number(chunk.value);
    callback();
  }

  getRby() {
    return this.rby;
  }
}

class ReportsByBorough extends PassThrough {
  private rba: Record<string, number> = {};
  constructor(options: TransformOptions = {}) {
    super({ ...options, objectMode: true });
  }

  _transform(
    chunk: RowChunk,
    _: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const borough = chunk.borough;
    const value = chunk.value;

    if (this.rba[borough] === undefined) {
      this.rba[borough] = 0;
      return callback();
    }
    this.rba[borough] += Number(value);
    callback();
  }

  getRba() {
    return this.rba;
  }
}

const rby = new ReportsByYear();
const rba = new ReportsByBorough();

const dataPipeline = pipeline(
  createReadStream("lcd.csv"),
  csvParser(),
  (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  },
);

dataPipeline.pipe(rby).on("finish", () => console.log(rby.getRby()));
dataPipeline.pipe(rba).on("finish", () => console.log(rba.getRba()));
