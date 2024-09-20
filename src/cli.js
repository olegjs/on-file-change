#!/usr/bin/env node

const { yellow, magenta } = require('chalk')
const { spawnSync } = require('child_process')
const { existsSync, readFileSync, writeFileSync } = require('fs')
const defaults = require('./defaults')

const {
  getChecksum,
  getChecksumFilePath,
  hashFromFileContent,
} = require('./checksum')

const argv = require('yargs')
  .scriptName('on-change')
  .usage('Usage: $0 --file [file] [command]')
  .usage('Usage: cat "hi" | $0 --stdin --output [file] [command]')
  .example(
    '$0 --file package-lock.json npm ci',
    'Reinstall dependencies on changed package-lock.json',
  )
  .option('stdin', {
    type: 'boolean',
    describe: 'Read from stdin',
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    describe:
      'Output path to read/write from (must be defined when using stdin)',
  })
  .option('file', {
    alias: 'f',
    describe: 'Path to file to check for changes',
    type: 'string',
  })
  .option('color', {
    describe: 'Force color or disable with --no-color',
    type: 'boolean',
  })
  .check((argv) => {
    if (!argv.file && !argv.stdin) {
      throw new Error('Either stdin or file must be provided')
    }
    if (argv.file && argv.stdin) {
      throw new Error('Either stdin or file must be provided')
    }
    if (argv.stdin && !argv.output) {
      throw new Error('Output must be provided with stdin')
    }
    return true
  })
  .demandCommand(1).argv

const getPastChecksum = (path) =>
  existsSync(path)
    ? hashFromFileContent(readFileSync(path, defaults.encoding))
    : null

const file = argv.stdin ? 0 : argv.file
const checksum = getChecksum(readFileSync(file, defaults.encoding))
const checksumFilePath = argv.output || getChecksumFilePath(argv.file)
const pastChecksum = getPastChecksum(checksumFilePath)

if (checksum !== pastChecksum) {
  console.log(
    `File "${magenta(argv.output || argv.file)}" has changed.`,
    `Running "${yellow(argv._.join(' '))}"...`,
  )

  const [command, ...args] = argv._
  spawnSync(command, args, { encoding: defaults.encoding, stdio: 'inherit' })
  writeFileSync(checksumFilePath, `${checksum}  ${argv.file}`)
}
