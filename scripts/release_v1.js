const path = require('path');

const semver = require('semver');

const {
  askForConfirmation,
  askForText,
  checkGitStatus,
  checkNpmAuth,
  runExec,
  revertCommit,
  revertChanges,
  getDateYYYYMMDDHHMMSS,
} = require('./release.helpers');

const packageJsonPath = path.resolve(__dirname, '../next/package.json');
const packageJson = require(packageJsonPath);

async function checkGitBranchAndStatus() {
  const releaseType = process.argv[2];
  console.log(`Checking your branch for ${releaseType} release...`);

  const resultBranch = await runExec('git branch --show-current', {
    silent: true,
  });
  const branchName = resultBranch.stdout.toString().trim();

  if (releaseType === 'dev') {
    // For dev releases, cannot be on main branch
    if (branchName === 'main') {
      console.error(`🟠 You are at "main". Dev versions cannot be released from main branch.`);
      process.exit(1);
    }
  } else if (releaseType === 'beta') {
    // For beta releases, must be on main branch and up to date
    if (branchName !== 'main') {
      console.error(
        `🟠 You are at "${branchName}" instead of "main" branch. Beta versions must be released from main.`
      );
      process.exit(1);
    }

    // Check if local main is up to date
    await runExec('git remote update', { silent: true });
    const resultStatus = await runExec('git status -uno', { silent: true });
    const mainStatus = resultStatus.stdout.toString().trim();

    if (!mainStatus.includes("Your branch is up to date with 'origin/main'.")) {
      console.error(`🟠 Please make sure your branch is up to date with the git repo.`);
      process.exit(1);
    }
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

async function bumpVersion({ newVersion }) {
  const cmd = `cd next && npm version --no-git-tag-version ${newVersion}`;
  await runExec(cmd);
}

async function build() {
  console.log('Building next version...');
  const cmd = 'cd next && npm run build';
  await runExec(cmd);
}

async function updateChangelog() {
  console.log('Updating changelog...');
  const cmd = 'cd next && npx generate-changelog';
  await runExec(cmd);
}

async function gitCommit({ newVersion, releaseType }) {
  console.log('Committing published version...');
  const prefix = `v1-${releaseType}`;

  let cmd;
  if (releaseType === 'beta') {
    // For beta, we commit package.json changes and changelog
    cmd = `git add next/package.json next/CHANGELOG.md && git commit -m "Release ${prefix} ${newVersion}" && git tag ${prefix}-${newVersion} && git push && git push origin --tags`;
  } else {
    // For dev, we only create a tag
    cmd = `git tag ${prefix}-${newVersion} && git push origin --tags`;
  }

  await runExec(cmd);
}

async function publish({ newVersion, releaseType, otp }) {
  console.log('Publishing new version...');
  const npmTag = `v1-${releaseType}`;
  const originalVersion = packageJson.version;

  try {
    // Publish with the dev/beta version
    const cmd = `cd next && npm publish --access=public --tag=${npmTag} --otp=${otp}`;
    await runExec(cmd);

    // For dev releases, revert package.json back to original version
    if (releaseType === 'dev') {
      const revertCmd = `cd next && npm version --no-git-tag-version ${originalVersion}`;
      await runExec(revertCmd);
    }

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

  await bumpVersion({ newVersion });

  // Only update changelog for beta releases
  if (releaseType === 'beta') {
    await updateChangelog();
    const answerChangelog = await askForConfirmation(
      'Changelog is updated. You may tweak it as needed. Once ready, press Y to continue.'
    );
    if (answerChangelog === 'no') {
      await revertChanges();
    }
  }

  await build();
  const otp = await askForText('🔐 What is the NPM Auth OTP? (Check 1PW) ');

  await gitCommit({ newVersion, releaseType });
  await publish({ newVersion, releaseType, otp });
}

init();
