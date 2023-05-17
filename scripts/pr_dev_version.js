const fs = require('fs');

function init() {
  const packageJson = fs.readFileSync('./package.json', 'utf8');
  const { version } = JSON.parse(packageJson);

  // TODO ideally I wanted to check diffs against "main",
  // but I don't know how to do it.
  if (version.includes('-dev')) {
    console.log(
      '🟠 This PR cannot be merged because the package.json version contains ".dev-". ' +
        '\n   Please change the version back to the original one. ' +
        '\n   Make sure the version is exactly the same as in the main branch.'
    );
    process.exit(1);
  }

  // In case the dev removes the -dev but forgot to add the beta!
  // Still not perfect as even "x.x.x-beta.0" would work.
  if (!version.includes('-beta.')) {
    console.log(
      '🟠 This PR cannot be merged because the package.json version DOES NOT contain ".beta-0".' +
        '\n   Please revert to the original version and try again. ' +
        '\n   Make sure the version is exactly the same as the main branch.'
    );
    process.exit(1);
  }

  console.log(`Package version ${version} is valid. Continuing...`);
}

init();
