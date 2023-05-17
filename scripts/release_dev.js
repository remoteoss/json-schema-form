const path = require('path');

const semver = require('semver');

const {
  askForConfirmation,
  askForText,
  checkGitStatus,
  checkNpmAuth,
  revertCommit,
  runExec,
} = require('./release.helpers');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = require(packageJsonPath);

async function checkGitBranchAndStatus() {
  console.log('Checking your PR branch...');
  const resultBranch = await runExec('git branch --show-current', {
    silent: true,
  });
  const branchName = resultBranch.stdout.toString().trim();
  if (branchName === 'main') {
    console.error(`🟠 You are at "main". Are you sure you wanna release a dev version here?`);
    process.exit(1);
  }

  await checkGitStatus();
}

async function getNewVersion() {
  const result = await runExec('git rev-parse --short HEAD^');
  // BUG TODO later The gitSHA does not match the real next commit sha
  const gitSHA = result.stdout.toString().trim();
  const currentVersion = packageJson.version;

  if (currentVersion.includes('-dev.')) {
    console.log('Bumping exisiting dev...');
    return currentVersion.replace(/-dev\.(.*)$/, `-dev.${gitSHA}`);
  }

  console.log('Creating a new dev...');
  const versionType = process.argv.slice(2)[0]; // major | minor | patch
  if (!versionType) {
    console.log('🟠 version type is missing. Make sure to run the script from package.json');
    process.exit(1);
  }
  const versionBase = semver.coerce(currentVersion); // 1.0.0-xxxx -> 1.0.0
  return semver.inc(versionBase, versionType) + `-dev.${gitSHA}`;
}

async function bumpVersion({ newVersion }) {
  // The tag will be added on gitCommit()
  const cmd = `npm version --no-git-tag-version ${newVersion}`;
  await runExec(cmd);
}

async function gitCommit({ newVersion }) {
  console.log('Comitting published version.');
  const cmd = `git add package.json package-lock.json && git commit -m "Release ${newVersion}" && git tag v${newVersion} && git push && git push origin --tags`;
  await runExec(cmd);
}

async function publish({ newVersion, otp }) {
  console.log('Publishing new version...');

  /*
    --access=public
      By default, NPM treats packages with workspace (@remoteoss) as private. This forces it to be public
    --tag=dev 
      VERY IMPORTANT: Having a tag tells NPM that this is not a "stable" version,
      otherwise it will be automatically installed by anyone doing "npm install <package-name>".
      This forces the devs to be precise in the version with "npm install <package-name>@x.x.x-dev.xxxxx"
      Know more at: https://stackoverflow.com/a/48038690/4737729
  */
  const cmd = `npm publish --access=public --tag=dev --otp=${otp}`;
  try {
    await runExec(cmd);
    console.log(`🎉 Version ${newVersion} published!"`);
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

  // Check Auth/OTP before the bumpVersion() to reduce the probability
  // of errors, leading files to be changed/pushed before the actual release.
  await checkNpmAuth();
  const otp = await askForText('🔐 What is the NPM Auth OTP? (Check 1PW) ');

  await bumpVersion({ newVersion });
  await gitCommit({ newVersion });
  await publish({ newVersion, otp });
}

init();
