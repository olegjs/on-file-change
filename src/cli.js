#!/usr/bin/env node

import { yellow, magenta } from 'chalk'
import { spawnSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { encoding as _encoding } from './defaults'

import {
  getChecksum,
  getChecksumFilePath,
  hashFromFileContent,
} from './checksum'

const argv = require('yargs')
  .scriptName('on-change')
  .usage('Usage: $0 --file [file] [command]')
  .example(
    '$0 --file package-lock.json npm ci',
    'Reinstall dependencies on changed package-lock.json',
  )
  .option('file', {
    alias: 'f',
    demandOption: true,
    describe: 'Path to file to check for changes',
    type: 'string',
  })
  .option('color', {
    describe: 'Force color or disable with --no-color',
    type: 'boolean',
  })
  .demandCommand(1).argv

const getPastChecksum = (path) =>
  existsSync(path) ? hashFromFileContent(readFileSync(path, _encoding)) : null

const checksum = getChecksum(readFileSync(argv.file, _encoding))
const checksumFilePath = getChecksumFilePath(argv.file)
const pastChecksum = getPastChecksum(checksumFilePath)

if (checksum !== pastChecksum) {
  console.log(
    `File "${magenta(argv.file)}" has changed.`,
    `Running "${yellow(argv._.join(' '))}"...`,
  )

  const [command, ...args] = argv._
  spawnSync(command, args, { encoding: _encoding, stdio: 'inherit' })
  writeFileSync(checksumFilePath, `${checksum}  ${argv.file}`)
}
