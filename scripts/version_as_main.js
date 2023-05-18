const { runExec } = require('./release.helpers');

async function getVersionIn(fileName) {
  const { stdout: mainPkg } = await runExec(`git show main:${fileName}`, { silent: true });
  const mainVersion = JSON.parse(mainPkg).version;
  return mainVersion;
}

async function init() {
  console.log('Reverting the package version...');

  const pkgVersion = await getVersionIn('package.json');

  // changing the version
  await runExec(`npm version --no-git-tag-version ${pkgVersion}`, { silent: true });

  // committing and push...
  await runExec(
    `git add package.json package-lock.json && git commit -m "Revert back to ${pkgVersion}"`
  );

  console.log(`Package reverted to ${pkgVersion} and pushed!`);
}

init();
