const path = require('path');

const semver = require('semver');

const {
  askForConfirmation,
  askForText,
  checkGitStatus,
  checkNpmAuth,
  runExec,
  revertCommit,
  getDateYYYYMMDDHHMMSS,
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
    console.error(`🟠 You are at "main". Are you sure you wanna release a v1 version here?`);
    process.exit(1);
  }

  await checkGitStatus();
}

async function getNewVersion() {
  const releaseType = process.argv[2];
  if (!['dev', 'beta'].includes(releaseType)) {
    console.error('🟠 Invalid release type. Use dev or beta');
    process.exit(1);
  }

  const currentVersion = packageJson.version;

  if (releaseType === 'dev') {
    const timestamp = getDateYYYYMMDDHHMMSS();
    console.log('Creating new dev version...');
    return `1.0.0-dev.${timestamp}`;
  }

  // For beta releases
  console.log('Creating new beta version...');
  if (currentVersion.includes('-beta.')) {
    return semver.inc(currentVersion, 'prerelease', 'beta');
  }
  return '1.0.0-beta.0';
}

async function bumpVersion({ newVersion, releaseType }) {
  // Only update package.json for beta releases
  if (releaseType === 'beta') {
    const cmd = `cd next && npm version --no-git-tag-version ${newVersion}`;
    await runExec(cmd);
  }
}

async function build() {
  console.log('Building next version...');
  const cmd = 'cd next && npm run build';
  await runExec(cmd);
}

async function gitCommit({ newVersion, releaseType }) {
  console.log('Committing published version...');
  const prefix = `v1-${releaseType}`;

  let cmd;
  if (releaseType === 'beta') {
    // For beta, we commit package.json changes
    cmd = `git add next/package.json && git commit -m "Release ${prefix} ${newVersion}" && git tag ${prefix}-${newVersion} && git push && git push origin --tags`;
  } else {
    // For dev, we only create a tag
    cmd = `git tag ${prefix}-${newVersion} && git push origin --tags`;
  }

  await runExec(cmd);
}

async function publish({ newVersion, releaseType, otp }) {
  console.log('Publishing new version...');
  const npmTag = `v1-${releaseType}`;

  const cmd = `cd next && npm publish --access=public --tag=${npmTag} --otp=${otp}`;
  try {
    await runExec(cmd);
    console.log(`🎉 ${npmTag} version ${newVersion} published!`);
    console.log(`Install with: npm i @remoteoss/json-schema-form@${npmTag}`);
  } catch {
    console.log('🚨 Publish failed! Perhaps the OTP is wrong.');
    await revertCommit({ newVersion });
  }
}

async function init() {
  const releaseType = process.argv[2];
  await checkGitBranchAndStatus();
  const newVersion = await getNewVersion();

  console.log(':: Current version:', packageJson.version);
  console.log(`:::::: New version (${releaseType}):`, newVersion);

  const answer = await askForConfirmation('Ready to commit and publish it?');

  if (answer === 'no') {
    process.exit(1);
  }

  await checkNpmAuth();
  const otp = await askForText('🔐 What is the NPM Auth OTP? (Check 1PW) ');

  await bumpVersion({ newVersion, releaseType });
  await build();
  await gitCommit({ newVersion, releaseType });
  await publish({ newVersion, releaseType, otp });
}

init();
