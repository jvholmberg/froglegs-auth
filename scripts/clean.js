
const { execSync } = require('child_process');

try {

  const start = Date.now();
  console.log('Start clean!');

  // Remove deps
  console.log('Remove dependencies');
  execSync('rm -rf node_modules');

  // Clean deps
  console.log('Install dependencies');
  execSync('npm i');

  const end = Date.now();
  console.log('Clean successful!');
  console.log(`Clean time: ${end - start} ms`);
} catch (error) {
  execSync('rm -rf ./dist');
  console.log('#############################################');
  console.log('# An error ocurred whilst cleaning project! #');
  console.log('#############################################');
  console.log();
  console.log(error);
  throw new Error('An error ocurred whilst cleaning project');
}
