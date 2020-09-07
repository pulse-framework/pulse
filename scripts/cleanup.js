#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { EOL: eol } = require('os');

console.log('Cleaning up...');

const args = process.argv.slice(2);
const paths = [
  path.join(__dirname, 'build'),
  path.join(__dirname, 'declarations'),
  !args.includes('--post') ? path.join(__dirname, 'dist') : undefined
];

for (const path of paths) {
  if (fs.existsSync(path)) {
    console.log('Deleting path:' + eol + path);
    fs.rmdirSync(path, {
      recursive: true
    });
  }
}
