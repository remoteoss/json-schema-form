const fs = require('fs');
const path = require('path');

function init() {
  const packageJson = fs.readFileSync(path.resolve(__dirname, '../next/package.json'), 'utf8');
  const { version } = JSON.parse(packageJson);

  if (version.includes('-dev')) {
    console.log(
      `🟠 This PR cannot be merged because the next/package.json version ${version} contains "-dev".` +
        '\n   The version in next/package.json should be a beta version (e.g., 1.0.0-beta.0).'
    );
    process.exit(1);
  }

  if (!version.includes('-beta.')) {
    console.log(
      `🟠 This PR cannot be merged because the next/package.json version ${version} is not a beta version.` +
        '\n   The version in next/package.json should be in format X.X.X-beta.Y (e.g., 1.0.0-beta.0).'
    );
    process.exit(1);
  }

  console.log(
    `The package version in next/package.json is ${version} and seems valid. Continuing...`
  );
}

init();
