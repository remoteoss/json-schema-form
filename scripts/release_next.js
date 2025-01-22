const path = require('path');

const semver = require('semver');

const {
  askForConfirmation,
  askForText,
  checkGitStatus,
  checkNpmAuth,
  runExec,
  revertCommit,
} = require('./release.helpers');

const packageJsonPath = path.resolve(__dirname, '../next/package.json');
const packageJson = require(packageJsonPath);

async function checkGitBranchAndStatus() {
  console.log('Checking your branch...');
  const resultBranch = await runExec('git branch --show-current', {
    silent: true,
  });
  const branchName = resultBranch.stdout.toString().trim();
  if (branchName === 'main') {
    console.error(`🟠 You are at "main". Are you sure you wanna release a next version here?`);
    process.exit(1);
  }

  await checkGitStatus();
}

async function getNewVersion() {
  const currentVersion = packageJson.version;
  const versionType = process.argv.slice(2)[0];

  if (!versionType) {
    console.log('🟠 version type is missing. Make sure to run the script from package.json');
    process.exit(1);
  }

  // Keep alpha tag for next versions
  const versionBase = semver.coerce(currentVersion);
  return semver.inc(versionBase, versionType) + '-alpha.0';
}

async function bumpVersion({ newVersion }) {
  const cmd = `cd next && npm version --no-git-tag-version ${newVersion}`;
  await runExec(cmd);
}

async function build() {
  console.log('Building next version...');
  const cmd = 'cd next && npm run build';
  await runExec(cmd);
}

async function gitCommit({ newVersion }) {
  console.log('Committing published version...');
  const cmd = `git add next/package.json && git commit -m "Release next ${newVersion}" && git tag next-v${newVersion} && git push && git push origin --tags`;
  await runExec(cmd);
}

async function publish({ newVersion, otp }) {
  console.log('Publishing new version...');

  // Use --tag=next to mark this as the "next" version
  const cmd = `cd next && npm publish --access=public --tag=next --otp=${otp}`;
  try {
    await runExec(cmd);
    console.log(`🎉 Next version ${newVersion} published!`);
  } catch {
    console.log('🚨 Publish failed! Perhaps the OTP is wrong.');
    await revertCommit({ newVersion });
  }
}

async function init() {
  await checkGitBranchAndStatus();
  const newVersion = await getNewVersion();

  console.log(':: Current version:', packageJson.version);
  console.log(':::::: New version:', newVersion);

  const answer = await askForConfirmation('Ready to commit and publish it?');

  if (answer === 'no') {
    process.exit(1);
  }

  await checkNpmAuth();
  const otp = await askForText('🔐 What is the NPM Auth OTP? (Check 1PW) ');

  await bumpVersion({ newVersion });
  await build();
  await gitCommit({ newVersion });
  await publish({ newVersion, otp });
}

init();
