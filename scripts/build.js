const fs = require('fs');
const path = require('path');

// eslint-disable-next-line import/no-extraneous-dependencies
const esbuild = require('esbuild');

const pkg = require('../package.json');

const licenseContent = fs.readFileSync(path.join(__dirname, '../LICENSE'), 'utf8');

const banner = `
/*!
 Copyright (c) ${new Date().getFullYear()} Remote Technology, Inc.
 NPM Package (coming soon): @remoteoss/json-schema-form
 Generated: ${new Date().toUTCString()}

 MIT LICENSE
 ${licenseContent}
*/ `;

const commonConfig = {
  entryPoints: ['src/index.js'],
  bundle: true,
  banner: { js: banner },
  legalComments: 'inline',
};

async function init() {
  // Build standalone
  await esbuild.build({
    ...commonConfig,
    outfile: 'dist/standalone.js',
    format: 'esm',
  });

  // Build CommonJS
  await esbuild.build({
    ...commonConfig,
    format: 'cjs',
    outfile: 'dist/index.cjs',
    external: Object.keys(pkg.dependencies),
  });

  // Build ES Modules
  await esbuild.build({
    ...commonConfig,
    format: 'esm',
    outfile: 'dist/index.js',
    external: Object.keys(pkg.dependencies),
  });
}

init();
