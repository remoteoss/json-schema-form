const readline = require('node:readline/promises');

const { exec } = require('child-process-promise');

async function checkGitStatus() {
  const result = await runExec('git status --porcelain', {
    silent: true,
  });
  const changes = result.stdout.toString().trim();
  if (changes) {
    console.error('🟠 There are unstaged git files. Please commit or revert them and try again.');
    process.exit(1);
  }
}

async function checkNpmAuth() {
  console.log('Checking NPM Authentication...');
  try {
    const result = await runExec('npm whoami');
    const username = result.stdout.toString().trim();
    if (username !== 'remoteoss') {
      console.log('🟠 You need to be logged to NPM as "remoteoss". Run "npm adduser"');
      process.exit(1);
    }
  } catch (e) {
    process.exit(1);
  }
}

async function askForText(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(question);
  rl.close();
  return answer;
}

async function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(`${question} (Y/n)`);
  const normalizedAnswer = answer.trim().toLowerCase();

  rl.close();

  if (normalizedAnswer === 'y' || normalizedAnswer === 'yes') {
    console.log('Confirmed! Proceeding...');
    return 'yes';
  }
  if (normalizedAnswer === 'n' || normalizedAnswer === 'no') {
    console.log('Cancelled. Exiting...');
    return 'no';
  }
  console.log('Invalid input. Please enter Y or n.');
  return askForConfirmation();
}

async function revertCommit({ newVersion, main } = {}) {
  const version = newVersion || 'x.x.x';
  // TODO later revert this automatically.
  console.log('🟠 Please revert the release commit and tag:');
  if (main) {
    console.log('🚨 Be sure of your actions as you are in the main branch!');
  }
  console.log("- Run 'git reset HEAD~1' to revert the last commit");
  console.log(`- Run 'git tag -d v${version}' to delete the tag locally`);
  console.log(
    `- Then run 'git push -f && git push --delete origin v${version}' to force the deletion of those.`
  );
}

async function revertChanges() {
  // TODO later revert this automatically.
  console.log('🟠 Please manually revert the changed files!');
  process.exit(1);
}

async function runExec(cmd, { silent } = {}) {
  if (!silent) console.log(`Exec: ${cmd}`);

  try {
    const result = await exec(cmd);
    if (!silent) console.log(result.stdout);
    if (result.stderr) {
      console.error(`stderr: ${result.stderr}`);
    }
    return result;
  } catch (e) {
    console.log('Error:', e.stderr);
    throw Error(e.stderr);
  }
}

module.exports = {
  checkNpmAuth,
  checkGitStatus,
  askForText,
  askForConfirmation,
  revertCommit,
  revertChanges,
  runExec,
};
