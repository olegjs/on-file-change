import { execSync } from 'child_process'
import { ok, ifError, strictEqual as equal } from 'assert'
import { join } from 'path'
import { existsSync, unlinkSync } from 'fs'
import { getChecksumFilePath } from './checksum'
import { version } from '../package.json'
import { magenta, yellow } from 'chalk'
import { encoding } from './defaults'

const run = (cmd) => execSync(cmd, { encoding })

export default () => {
  const scriptPath = join(__dirname, 'cli.js')
  const command = `node ${scriptPath}`

  const options = [
    '--file',
    '-f',
    '--color',
    '--no-color',
    '--version',
    '--help',
  ]

  try {
    const helpText = run(`${command} --help`)

    options.forEach((option) =>
      ok(helpText.includes(option), `Expect "${option}" in help`),
    )

    const versionText = run(`${command} --version`)
    equal(versionText.trim(), version)

    const checksumFilePath = getChecksumFilePath(scriptPath)
    const payload = 'echo'

    if (existsSync(checksumFilePath)) unlinkSync(checksumFilePath)

    const firstRunText = run(`${command} --file ${scriptPath} ${payload}`)
    ok(firstRunText.includes(payload))
    ok(firstRunText.includes(scriptPath))

    const secondRunText = run(`${command} -f ${scriptPath} ${payload}`)
    equal(secondRunText, '')

    unlinkSync(checksumFilePath)

    const colorText = run(`${command} --color --file ${scriptPath} ${payload}`)
    ok(colorText.includes(magenta(scriptPath)))
    ok(colorText.includes(yellow(payload)))

    unlinkSync(checksumFilePath)
  } catch (error) {
    ifError(error)
  }
}
