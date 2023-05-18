const fs = require('fs');

const { runExec } = require('./release.helpers');

async function getVersionsOf(fileName) {
  const packageJson = fs.readFileSync(`./${fileName}`, 'utf8');
  const { version: branchVersion } = JSON.parse(packageJson);

  const { stdout: mainPkg } = await runExec(`git show main:${fileName}`, { silent: true });
  const mainVersion = JSON.parse(mainPkg).version;

  return {
    branch: branchVersion,
    main: mainVersion,
  };
}

async function init() {
  console.log('Checking your package version...');
  const pkgVersions = await getVersionsOf('package.json');
  const pkgLockVersions = await getVersionsOf('package-lock.json');

  // Compare package from this branch to main
  const isPkgWrong = pkgVersions.branch !== pkgVersions.main;
  const isPkgLockWrong = pkgLockVersions.branch !== pkgLockVersions.main;

  if (isPkgWrong || isPkgLockWrong) {
    console.log(
      '🟠 PR cannot be merged because the version of package.json or package-lock.json is incorrect.' +
        `\n   ::: Your branch: ${isPkgWrong ? pkgVersions.branch : pkgLockVersions.branch}` +
        `\n   ::: Main branch: ${isPkgWrong ? pkgVersions.main : pkgLockVersions.main}` +
        `\n   Run "npm run version_as_main" to revert it back to ${pkgVersions.main}.`
    );
    process.exit(1);
  }

  console.log(`Package version ${pkgVersions.branch} matches main's branch. Continuing...`);
}

init();
