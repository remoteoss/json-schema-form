const path = require('path');

const semver = require('semver');

const {
  askForConfirmation,
  askForText,
  checkGitStatus,
  checkNpmAuth,
  runExec,
  revertChanges,
  revertCommit,
} = require('./release.helpers');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = require(packageJsonPath);

async function checkGitBranchAndStatus() {
  console.log('Checking your main branch...');
  const resultBranch = await runExec('git branch --show-current', {
    silent: true,
  });
  const branchName = resultBranch.stdout.toString().trim();
  if (branchName !== 'main') {
    console.error(
      `🟠 You are at "${branchName}" instead of "main" branch. Are you sure you wanna release a stable version here?`
    );
    process.exit(1);
  }

  // Check if local main is up to date.
  await runExec('git remote update', { silent: true });
  const resultStatus = await runExec('git status -uno', { silent: true });
  const mainStatus = resultStatus.stdout.toString().trim();

  if (!mainStatus.includes("Your branch is up to date with 'origin/main'.")) {
    console.error(`🟠 Please make sure your branch is up to date with the git repo.`);
    process.exit(1);
  }
  await checkGitStatus();
}

function getNewVersion() {
  const currentVersion = packageJson.version;

  // TODO later - get the right version based on commit history.
  const versionType = process.argv.slice(2)[0];
  const versionBase = semver.coerce(currentVersion);
  return semver.inc(versionBase, versionType) + '-beta.0';
}

async function bumpVersion({ newVersion }) {
  const cmd = `npm version --no-git-tag-version ${newVersion}`;
  await runExec(cmd);
}

async function updateChangelog() {
  console.log('Updating changelog...');
  const cmd = `npx generate-changelog`;
  await runExec(cmd);
}

async function commit({ newVersion }) {
  console.log('Comitting new version...');
  const cmd = `git add package.json package-lock.json CHANGELOG.md && git commit -m "Release ${newVersion}" && git tag v${newVersion} && git push && git push origin --tags`;
  await runExec(cmd);

  // console.info(`Creating github release...`);
  // // @TODO - Needs gh installed globally. Let's do it manually for now.
  // await runExec(`gh release create v${newVersion}`);
}

async function publish({ newVersion, otp }) {
  console.log('Publishing new version...');

  /*
    --access=public
      By default, NPM treats packages with workspace (@remoteoss) as private. This forces it to be public
    --tag=latest 
      VERY IMPORTANT: This tag tells NPM that although beta this is our "latest" version,
      This way when devs install the package, it will consider this beta the stable one.
  */
  const cmd = `npm publish --access=public --tag=latest --otp=${otp}`;
  try {
    await runExec(cmd);
    console.log(`🎉 Version ${newVersion} published!"`);
  } catch {
    console.log('🚨 Publish failed! Perhaps the OTP is wrong.');
    await revertCommit({ newVersion, main: true });
  }
}

// TODO later - Ideally this should be a GH Action triggered after a PR merge:
// - GH Action triggers, which opens a new PR with the new version + CHANGELOG.
// - A maintainer review the MR and approve it.
//    - Or tweak it if needed, or even close it, in case it doesn't make sense to release a new version.
// - On release-PR merge, another GH Action is triggered to do the NPM publish.
async function init() {
  await checkGitBranchAndStatus();

  const newVersion = getNewVersion();

  console.log(':: Current version:', packageJson.version);
  console.log(':::::: New version:', newVersion);

  const answerVersion = await askForConfirmation('Is this version correct?');
  if (answerVersion === 'no') {
    process.exit(1);
  }

  await checkNpmAuth();

  await bumpVersion({ newVersion });
  await updateChangelog();

  const answerChangelog = await askForConfirmation(
    'Changelog is updated. You may tweak it as needed. Once ready, press Y to continue.'
  );

  if (answerChangelog === 'no') {
    await revertChanges();
  }

  const otp = await askForText('🔐 What is the NPM Auth OTP? (Check 1PW) ');

  await commit({ newVersion });
  await publish({ newVersion, otp });
}

init();
