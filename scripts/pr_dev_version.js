const fs = require('fs');

function init() {
  const packageJson = fs.readFileSync('./package.json', 'utf8');
  const { version } = JSON.parse(packageJson);

  // TODO ideally I wanted to check diffs against "main",
  // This works fine -> https://github.com/remoteoss/json-schema-form/pull/3/commits/20b69f27eb14dcba86698766315a9538f9c8ae16
  // but it fails when running on CI.
  // So we are left with a more fragile version:
  if (version.includes('-dev') || !version.includes('-beta.0')) {
    console.log(
      `🟠 This PR cannot be merged because the package.json version ${version} seems invalid.` +
        '\n   Run "npm run version_as_main" to revert it back as it is on the main branch.'
    );
    process.exit(1);
  }

  console.log(`Package version ${version} seems valid. Continuing...`);
}

init();
