# node-nibblets

This is a collection of small typescript apps, each focusing on different core node and javascript features, node's native libraries, the asynchronous nature of node's reactor pattern driving the event loop, as well as various control flow patterns applied to common problems in software development, as outlined in the brilliant "NodeJS Design Patterns" book.

While it mostly does not touch on general backend development topics like networking, software architecture, database management and so on, the purpose of this repository is to demonstrate if not proficiency, then at least an understanding of node's toolbelt and asynchronous programming in general to the fabled potential employer. A show of low-level knowledge, rather than some framework's syntax. As far as these other topics go, I invite you to take a look at my other repositories or give me a call and I will gladly discuss anything development related. 

The repository does not have a proper structure and the app logic varies in complexity, for some, the code is mostly self-documenting, while others require a deeper explanation. In any case, I chose not to include comments inside the files. Instead, I will give a small explanation for each app, directing your attention not to the functionality, but to the implementation logic and patterns I am attempting to demonstrate.

The individual apps are not meant to be run, however each includes a `package.json`, a `tsconfig.json`, as well as any test data for I/O operations, in case you'd like to test them yourself.

Similarly to an academic paper, this repository serves as a sort of aggregation of too much research time. 

This should be a proper long read, nevertheless I hope you find time to read through all the code in this repository, as I hope even an experienced developer may find it quite interesting.

_____

## concat-files

`concat` is a callback passing style function that gathers `utf8` data from an arbitrary amount of files into a `destination` file.

While the `callback` is usually the last argument, in this case to have each input `file` as an individual argument, I had to switch up the ordering. 

While using modern `promises` would make the code more readable, in this case I intentionally limit myself to the legacy callback APIs to demonstrate the sequential execution flow using the recursive `iterate` function. 

The `iterate` function's  base case is reached when the current iteration's `index` reaches the `files` array's length, calling the `concat` function's `callback`. The other exit condition is triggered on any `error` resulting from an I/O operation.

### The pattern 

>Using the `iterate` function, `concat` is able to sequentially gather each `file`'s data and eventually writes the data into `dest.txt`.

_____

## concat-stream

This is a variation of the `concat-files` using node's `stream` APIs.

The `concat` function returns a promise that will eventually resolve once `concat` writes the data to the `destination` file or reject on any error thrown by an I/O operation. 

`Readable.from` is used to generate an object mode readable stream from the input `files` array, and utilizes the piped `transform` stream's `callback` behavior, as well as the `late piping pattern` to sequentially write the current `file`'s data into the `destination` file.

`{end: false}` option is used on the late piped `writeStream` to prevent it from closing after the initial `readStream` emits a `close` event. 

_____

## crawler

This includes three vaguely similar implementations of a web crawler. The crawler recursively saves the html data of a given URL, limited to the original URL's hostname. 

### 1. `recursive-throttled-parallel-CPS`

This is a recursive callback passing style implementation with additional concurrency throttling on one of the functions.

The code is quite cumbersome, so I'll try to outline the execution flow, individual function outputs and notable patterns below.

>I'd like to note here that purposely limiting yourself to callback style APIs, especially with recursion, makes the code needlessly complicated, unreadable, error prone, and serves only as a proof of concept exercise to demonstrate asynchronous control flow patterns   using only legacy APIs.
>Having written this not so long ago, even now I find the mind-bending patterns necessary to make each crawler version work overwhelming.
>I'd also like to note that a large portion of this app's code is lifted from the book, but with plenty enough of my own input and optimizations, to make it what a cynic might call "legally distinct". In any case, I'd gladly discuss the implementation on a call.

First, the utility functions:
* The `getPageLinks` function synchronously parses a given html data and returns an array of unique links for recursive crawling.
* The `urlToFileName` function synchronously parses a given URL and returns a string `filepath` used as in I/O operations.
* The `checkFileCache` function asynchronously reads a given `filepath` and either returns the cached data of an already crawled file or signals that no file has been found.
* The `getHtml` function asynchronously fetches html for a given URL.
* The `write` function recursively creates folders for a given `filepath` and writes the html `data` to the output file.

Now, the execution flow:
* The bootstrap `crawl` function checks the provided `cache: Set<string>` for the current `filepath` and either returns using `process.nextTick()` to keep consistent asynchronicity, or adds the `filepath` to the `cache`, fetches the `html` data for the current URL, writes the `data` to the output file and triggers the next function.
* The `crawlLinks` function implements a limited parallel execution flow pattern to artificially throttle the recursive `crawl` calls and keep the recursion under control.
	* The recursive `next` function is designed to only spool up a set amount of recursive tasks as set by the `concurrency` variable.
	* Each task will eventually decrement the `running` variable, freeing up a slot for another iteration.

The initial `crawl` call on line `121` is set to crawl the nextjs homepage with a depth of 2, quickly finishing, without triggering any denial of service errors.

### 2. `recursive-queue-parallel-limited-CPS`

This is a slightly modified, slightly more readable version of the callback style crawler implementation.

The main difference is the implementation of a `Queue` structure extending the `EventEmitter` to globally limit the concurrency on the app level and introduce observability to this callback hell.

The `Queue` interface is quite simple. A new task may be enqueued using the `pushTask` methods, which simply pushes the `task` to the internal `queue` array and schedules the task execution with a deferred call to the `next` method.

The complication in the `pustTask` method is the introduction of the `innerCb` to any tasks it's scheduling, a sort of revealing constructor pattern like in a `Promise` that provides it's internal methods to the executor function. The trick here is that instead of a direct `crawl` function call we provide it a wrapper function with an `innerCb` callback, which is eventually triggered by the `next()` method.

The `next` method on each call checks for a recursive base case of `running === 0` and `queue.length === 0` to either emit an `empty` event signalling that there are no more tasks left to process, or shifting the array, running the `task` and eventually triggering another call to `next`.

The other difference is the introduction of the bootstrap `crawler` function to push `crawl` tasks to the `Queue`. 

### 3. `recursive-queue-parallel-limited-promises`

This is the last version, where I finally introduce promises to make the crawler somewhat presentable, significantly simplifying the logic involved and reducing the line count.

While this makes it the least interesting version from a coding challenge perspective, it does start to resemble something vaguely passable as a real crawler.

The main difference compared to previous versions is the rewrite of utility functions, having some responsibilities delegated to the new `download` function, and others integrated into the `crawl` and `crawlLinks` function.

The other difference is the slightly different `Queue` `next` and `push` methods implementation. This time around, the `task` does not need an esoteric `innerCb`, opting instead to use a simple `finally` call.

On the other hand, the esoteric part of this implementation is the new `push` method. To understand its logic we need to look at the `crawlLinks` function, which returns `Promise.all` for all `crawl` calls over the page's links. Notice how the starting from the initial `crawl` with each iteration the original function call becomes a big chain of promises, which eventually resolves once the queue is empty. To achieve this, the `push` method returns a promise that only resolves once the pushed task completes by passing its own `resolve` and `reject` methods to `then` call on a task promise.

_____
## csv-stream

Uses `csv-parser` and a combination of custom late-piped `PassThrough` streams to parse and filter data.

`ReportsByYear` and `ReportsByBorough` extend `PassThrough` with `objectMode` set to `true` in the constructor. 

Every chunk is then aggregated and the final result is logged.

_____

## fib-iterator-generator

Showcases functional, class, async iterators and generators.

_____
## observable-find-regex

The `FindRegex` class accepts a `RegExp` as the argument and provides an `addFile` method, and a `find` method that searches the provided files' contents for the given regex.

Observability is introduced by extending the `EventEmitter` class.

_____
## parallel-map-with-concurrency

Used to apply async logic tp the provided iterable with limited concurrency.

Accepts an `iterable`, a `mapper` function that returns a promise and the `concurrency` limit.

Inside the returned promise, an `output` and an `errors` array are initialized. The `next` function and the `running` variable are used for limiting the async task concurrency.

The `next` function uses a `while` loop to spool up new async tasks by applying the `mapper` function over each element in the provided `iterable`. Once every `mapper` promise is settled, the outer promise is either resolved or rejected.

_____

## parallel-tcp-fileshare

Uses multiplexing on the client side and demultiplexing on the server side to send multiple files in parallel over a TCP socket.

On the client, a socket connection and a `channels` array are initialized.
Each `channel` is a `pipeline` of an encrypted and compressed stream of a given file. 

On socket connection an initial packet consisting of the `iv` for decryption and the `files` array is sent to the server. 

The `multiplex` function keeps a counter of `open` channels. For each channel, a `readable` listener is registered. The listener adds the `channel id` as the first byte of each packet sent to the server. Once the `open` counter reaches 0, the tcp connection is shut down.

On the server, the `handleMeta` function is used to read the first chunk on socket connection containing the decryption `iv`, as well as the array of file names, then the applied `readable` listener is removed  and the `demultiplex` function takes over the socket. 

On each subsequent chunk, the first byte is read to determine the `channel id`, and the rest is written into the appropriate `channel`. 

______

## promise-all

An implementation of `Promise.all`.  Accepts an array of promises and returns a promise that eventually either resolves with the result of each individual promise, or rejects with the first rejected promise. 

_____

## recursive-find-in-file 

The `recursiveFind` function uses callback-passing style APIs to sequentially read files from the provided array and returns an array of files containing a given `keyword`.

The `iterate` function sequentially reads files and recursively calls itself until eventually the initial callback is called with the output array.


