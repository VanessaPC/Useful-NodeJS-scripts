#!/bin/node
/* Usage: Script to validate the any markdown
* Description: Creates an async parallel loop  that traverses the directory where you have your
*               markdown files and folders, identifying all markdown files and analysing any errors in them.
* Packages you will need:
    - vfile-reporter
    - to-vfile
    - remark
        - remark preset lint markdown styleguide (although, you can use the present for writability, readability, etc.)
*
*/


const fs = require('fs');

const path = require('path');

const dir = process.argv[2];

const tovfile = require('to-vfile');

const vreporter = require('vfile-reporter');

// pattern to match the files we want to process.
const fileRX = new RegExp(/.*\/(index.md)/g);

// require the script
const remark = require('remark');

const styleguideLint = require('remark-preset-lint-markdown-style-guide');

// script that lints markdown files
// async parallel recursive loop
function walk(dir, done) {
  let results = [];

    // start to read the directory
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;

    if (!pending) return done(null, results);

    // for each file
    list.forEach((file) => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);

            results.forEach((value) => {
              // Lint all the markdown
              if (value.match(fileRX) !== null) {
                const output = remark()
                  .use(styleguideLint)
                  .process(tovfile.readSync(value), (err, file) => {
                    // report all the errors per file
                    console.error(vreporter(file));
                  });
              }
            });
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk(dir, () => {});
