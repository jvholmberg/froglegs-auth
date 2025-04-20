/* eslint-disable @typescript-eslint/no-require-imports */

const { execSync } = require("child_process");
const dotenv = require("dotenv");
const { NodeSSH } = require("node-ssh");

dotenv.config({ path: ".env.production.local" });

const onStdout = (chunk) => console.log("stdout", chunk.toString("utf8"));
const onStderr = (chunk) => console.log("stderr", chunk.toString("utf8"));

const sshCommandOptions = {
  cwd: "/wwwroot",
  onStdout,
  onStderr,
  execOptions: { pty: true }
};

const ssh = new NodeSSH();

try {
  const start = Date.now();
  
  console.log("Clear all unused images on local machine");
  execSync(`docker image prune -a -f`);

  console.log("Connect to server:", process.env.REMOTE_HOST);
  ssh.connect({
    host: process.env.REMOTE_HOST,
    port: process.env.REMOTE_PORT,
    username: process.env.REMOTE_USERNAME,
    password: process.env.REMOTE_PASSWORD,
  }).then(async () => {
    console.log("Clear all unused images on server");
    await ssh.execCommand("docker image prune -a -f", sshCommandOptions);
  });

  const end = Date.now();
  console.log("Clear successful!");
  console.log(`Clear time: ${(end - start) / 1000} sek`);
} catch (error) {
  console.log("#############################################");
  console.log("# An error ocurred whilst clearing docker!  #");
  console.log("#############################################");
  console.log();
  console.log(error);
  throw new Error("An error ocurred whilst clearing docker");
}
