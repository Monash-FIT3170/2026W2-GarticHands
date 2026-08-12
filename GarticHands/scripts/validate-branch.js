import { execSync } from 'node:child_process'

const branch = execSync('git branch --show-current', {
  encoding: 'utf8',
}).trim()

// These branches don't follow the feature branch naming convention
const protectedBranches = ['main']

if (protectedBranches.includes(branch)) {
  process.exit(0)
}

// Allowed format: type/description
const branchPattern =
  /^(feature|bugfix|docs|refactor|test|chore)\/[a-z0-9]+(?:-[a-z0-9]+)*$/

if (!branchPattern.test(branch)) {
  console.error(`
❌ Invalid branch name

Current:
  ${branch}

Required format:
  <type>/<description>

Allowed types:
  feature, bugfix, docs, refactor, test, chore

Examples:
  feature/lobby-resize
  bugfix/crash-on-guess
`)

  process.exit(1)
}