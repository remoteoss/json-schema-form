import path from 'path';
import semver from 'semver';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

import {
  askForConfirmation,
  askForText,
  checkGitStatus,
  checkNpmAuth,
  runExec,
  revertCommit,
  revertChanges,
  getDateYYYYMMDDHHMMSS,
} from './release.helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const releaseTypes = ['dev', 'beta', 'official'];
const bumpTypes = ['patch', 'minor', 'major'];

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
  async function getVersionsFromGitTags() {
    const result = await runExec(`git tag --list --sort=-version:refname`, { silent: true });
    const tags = result.stdout.toString().trim().split('\n').filter(tag => tag.startsWith('v'));
    return tags
  }

  const releaseType = process.argv[2];
  const bumpType = process.argv[3];

  if (!releaseTypes.includes(releaseType)) {
    console.error(`🟠 Invalid release type. Use ${releaseTypes.join(', ')}`);
    process.exit(1);
  }

  const currentVersion = packageJson.version;

  if (releaseType === 'dev') {
    const timestamp = getDateYYYYMMDDHHMMSS();
    console.log('Creating new dev version...');
    return `1.0.0-dev.${timestamp}`;
  }

  if (releaseType === 'beta') {
    // For beta releases
    console.log('Creating new beta version...');
    if (currentVersion.includes('-beta.')) {
      return semver.inc(currentVersion, 'prerelease', 'beta');
    } else {
      // get latest beta version from git tags
      const tags = await getVersionsFromGitTags();
      const latestBetaTag = tags.find(tag => tag.includes('-beta.'));
      // If no beta version found, use current version with -beta.0 as the starting point
      const latestBetaVersion = latestBetaTag ? latestBetaTag.replace('v', '') : `${currentVersion}-beta.0`;
      return semver.inc(latestBetaVersion, 'prerelease', 'beta');
    }
  }

  if (releaseType === 'official') {
    if (!bumpTypes.includes(bumpType)) {
      console.error(`🟠 Invalid bump type. Use ${bumpTypes.join(', ')}\ne.g. pnpm run release patch`);
      process.exit(1);
    }

    // get latest official version from git tags
    const tags = await getVersionsFromGitTags();
    const latestOfficialTag = tags.find(tag => !tag.includes('-beta.') && !tag.includes('-dev.'));
    // If no official version found, use v0.0.0 as the starting point
    const latestOfficialVersion = latestOfficialTag 
      ? semver.coerce(latestOfficialTag).version
      : '0.0.0';

    return semver.inc(latestOfficialVersion, bumpType);
  }
}

async function bumpVersion({ newVersion }) {
  const cmd = `npm version --no-git-tag-version ${newVersion}`;
  await runExec(cmd);
}

async function build() {
  console.log('Building version...');
  const cmd = 'npm run build';
  await runExec(cmd);
}

async function updateChangelog() {
  console.log('Updating changelog...');
  const cmd = 'npx generate-changelog';
  await runExec(cmd);
}

async function gitCommit({ newVersion, releaseType }) {
  console.log('Committing published version...');

  let cmd;
  if (releaseType === 'beta' || releaseType === 'official') {
    // For beta and official releases, we commit package.json changes and changelog
    cmd = `git add package.json CHANGELOG.md && git commit -m "Release ${newVersion}" && git tag ${newVersion} && git push && git push origin --tags`;
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
    const cmd = `npm publish --access=public --tag=${npmTag} --otp=${otp}`;
    await runExec(cmd);

    // For dev releases, revert package.json back to original version
    if (releaseType === 'dev') {
      const revertCmd = `npm version --no-git-tag-version ${originalVersion}`;
      await runExec(revertCmd);
    }

    console.log(`🎉 ${npmTag} version ${newVersion} published!`);
    if (releaseType === 'beta') {
      console.log(`✍️ REMINDER: Please publish the release on Github too as "pre-release".`);
    }
    
    if (releaseType === 'official') {
      console.log(`✍️ REMINDER: Please publish the release on Github too.`);
    }
    console.log(`Install with: npm i @remoteoss/json-schema-form@${npmTag}`);
  } catch {
    console.log('🚨 Publish failed! Perhaps the OTP is wrong.');
    await revertCommit({ newVersion });
  }
}

async function init() {
  const releaseType = process.argv[2];
  // await checkGitBranchAndStatus();
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
