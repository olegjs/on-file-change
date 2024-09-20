const { execSync } = require('child_process')
const { ok, ifError, strictEqual: equal, throws } = require('assert')
const path = require('path')
const { existsSync, unlinkSync } = require('fs')
const { getChecksumFilePath } = require('./checksum')
const package = require('../package.json')
const { magenta, yellow } = require('chalk')
const { encoding } = require('./defaults')

const run = (cmd) => execSync(cmd, { encoding, stdio: 'pipe' })

module.exports = () => {
  const scriptPath = path.join(__dirname, 'cli.js')
  const command = `node ${scriptPath}`

  const options = [
    '--stdin',
    '--output',
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
    equal(versionText.trim(), package.version)

    const checksumFilePath = getChecksumFilePath(scriptPath)
    const payload = 'echo'

    if (existsSync(checksumFilePath)) unlinkSync(checksumFilePath)

    const firstRunText = run(`${command} --file ${scriptPath} ${payload}`)
    ok(firstRunText.includes(payload))
    ok(firstRunText.includes(scriptPath))

    const secondRunText = run(`${command} -f ${scriptPath} ${payload}`)
    equal(secondRunText, '')

    unlinkSync(checksumFilePath)

    // verify output option works

    const outputFile = path.resolve(__dirname, 'test-file.sha')
    if (existsSync(outputFile)) unlinkSync(outputFile)

    const thirdRunText = run(
      `${command} --file ${scriptPath} --output ${outputFile} ${payload}`,
    )
    ok(thirdRunText.includes(payload))
    ok(thirdRunText.includes(outputFile))

    const fourthRunText = run(
      `${command} -f ${scriptPath} --output ${outputFile} ${payload}`,
    )
    equal(fourthRunText, '')

    unlinkSync(outputFile)

    // verify stdin / output works

    const fifthRunText = run(
      `cat ${scriptPath} | ${command} --stdin --output ${checksumFilePath} ${payload}`,
    )
    ok(fifthRunText.includes(payload))
    ok(fifthRunText.includes(checksumFilePath))

    const sixthRunText = run(
      `cat ${scriptPath} | ${command} --stdin --output ${checksumFilePath} ${payload}`,
    )
    equal(sixthRunText, '')

    unlinkSync(checksumFilePath)

    const colorText = run(`${command} --color --file ${scriptPath} ${payload}`)
    ok(colorText.includes(magenta(scriptPath)))
    ok(colorText.includes(yellow(payload)))

    unlinkSync(checksumFilePath)

    throws(
      () => {
        run(`${command} --stdin --file ${scriptPath} ${payload}`)
      },
      (err) => {
        ok(err.stderr.includes('Either stdin or file must be provided'))
        return true
      },
    )

    throws(
      () => {
        run(`${command} ${payload}`)
      },
      (err) => {
        ok(err.stderr.includes('Either stdin or file must be provided'))
        return true
      },
    )

    throws(
      () => {
        run(`${command} --stdin ${payload}`)
      },
      (err) => {
        ok(err.stderr.includes('Output must be provided with stdin'))
        return true
      },
    )
  } catch (error) {
    ifError(error)
  }
}
