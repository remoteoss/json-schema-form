/* eslint-disable no-console */
// const fs = require('node:fs')
// const process = require('node:process')

import fs from 'node:fs'
import process from 'node:process'

const BASELINE_FILE = './test/v0-baseline-test-results.json'
const CURRENT_FILE = './test/v0-test-results.json'

if (!fs.existsSync(BASELINE_FILE)) {
  console.error('🚨 Baseline file not found. Run Jest and save it first!')
  process.exit(1)
}

// Load test results
const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'))
const current = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf8'))

console.log(baseline)
console.log(current)

// Extract test statuses
function getTestStatus(results) {
  const statusMap = new Map()
  results.testResults.forEach((testFile) => {
    testFile.assertionResults.forEach((test) => {
      statusMap.set(test.fullName, test.status)
    })
  })
  return statusMap
}

const baselineStatus = getTestStatus(baseline)
const currentStatus = getTestStatus(current)

let failed = false

baselineStatus.forEach((oldStatus, testName) => {
  const newStatus = currentStatus.get(testName)

  if (oldStatus === 'passed' && newStatus !== 'passed') {
    console.error(`🚨 Regression: "${testName}" was passing but now fails!`)
    failed = true
  }

  if (oldStatus === 'failed' && newStatus === 'passed') {
    console.error(`🎉 Fixed: "${testName}" was failing but now passes.`)
    failed = true
  }
})

if (failed) {
  console.error('❌ V0 test results changed unexpectedly.')
  process.exit(1)
}
else {
  console.log('✅ V0 test results match the expected state.')
}
