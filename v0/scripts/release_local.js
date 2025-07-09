const path = require('path');

const { checkGitStatus, runExec } = require('./release.helpers');

const packageJson = require(path.resolve(__dirname, '../package.json'));
const repoPath = path.resolve('../');

async function createTarball() {
  const version = packageJson.version;
  // create the tarball
  await runExec(`npm run build && npm pack`);
  // rename it for uniqueness and avoid caching when installing.
  const tarNewName = `local-${version}.tgz`;
  await runExec(`mv remoteoss-json-schema-form-${version}.tgz ${tarNewName}`);

  console.log(
    '🎉 Success! Go to your project and re-install JSF with a local version:\n' +
      `npm un @remoteoss/json-schema-form && npm i -S ${repoPath}/json-schema-form/${tarNewName}`
  );
}

async function init() {
  await checkGitStatus();
  await createTarball();
}

init();
