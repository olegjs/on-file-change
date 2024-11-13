import path, { join, format as _format } from 'path'
const { basename, dirname } = path
import { createHash } from 'crypto'
import { algorithm as _algorithm, fileExtension } from './defaults'

export function getChecksum(s, algorithm = _algorithm, format = 'hex') {
  return createHash(algorithm).update(s).digest(format)
}

export function hashFromFileContent(s) {
  return s.trim().split(/\s+/)[0]
}

export function getChecksumFilePath(filePath) {
  return join(
    dirname(filePath),
    _format({
      name: `.${basename(filePath)}`,
      ext: fileExtension,
    }),
  )
}
