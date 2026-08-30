import { execSync } from 'node:child_process';

// Github actions will provide pr branch name,
// otherwise, gets the local branch name
const branch =
  process.env.GITHUB_REF_HEAD ||
  execSync('git branch --show-current', {
    encoding: 'utf8',
  }).trim();

// These branches don't follow the feature branch naming convention
const protectedBranches = ['main', 'dev'];

if (protectedBranches.includes(branch)) {
  process.exit(0);
}

// Allowed format: type/description
const branchPattern = /^(feature|bugfix|docs|refactor|test|chore)\/[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;

if (!branchPattern.test(branch)) {
  console.error('');
  console.error('❌ COMMIT BLOCKED: Invalid branch name');
  console.error('');
  console.error(`Current branch: ${branch}`);
  console.error('');
  console.error('Required format:');
  console.error('  <type>/<description>');
  console.error('');
  console.error('Allowed types:');
  console.error('  feature, bugfix, docs, refactor, test, chore');
  console.error('');
  console.error('Examples:');
  console.error('  feature/lobby-resize');
  console.error('  bugfix/crash-on-guess');
  console.error('');
  console.error('Rename your branch before committing.');
  console.error('');

  process.exit(1);
}
