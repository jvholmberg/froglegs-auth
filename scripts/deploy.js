/* eslint-disable @typescript-eslint/no-require-imports */

const { execSync } = require("child_process");
const dotenv = require("dotenv");
const { NodeSSH } = require("node-ssh");

dotenv.config({ path: ".env.production.local" });

// Set these before attempting upload
const DOCKER_EXTERNAL_PORT = 3003;
const DOCKER_IMAGE_NAME = "vajper_auth";
const DOCKER_CONTAINER_NAME = "vajper_auth";

if (!DOCKER_EXTERNAL_PORT) { throw new Error("DOCKER_EXTERNAL_PORT not set")}
if (!DOCKER_IMAGE_NAME) { throw new Error("DOCKER_IMAGE_NAME not set")}
if (!DOCKER_CONTAINER_NAME) { throw new Error("DOCKER_CONTAINER_NAME not set")}

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
  
  console.log("Build image");
  const buildArgs = [
    `db_host="${process.env.DATABASE_HOST}"`,
    `db_user="${process.env.DATABASE_USER}"`,
    `db_password="${process.env.DATABASE_PASSWORD}"`,
    `db_port="${process.env.DATABASE_PORT}"`,
    `db_name="${process.env.DATABASE_NAME}"`,
    `encryption_key="${process.env.ENCRYPTION_KEY}"`,
    `two_factor_mandatory="${process.env.TWO_FACTOR_MANDATORY}"`,
    `app_display_name="${process.env.APP_DISPLAY_NAME}"`,
    `smtp_port="${process.env.SMTP_PORT}"`,
    `smtp_host="${process.env.SMTP_HOST}"`,
  ].map((e) => `--build-arg ${e}`).join(" ");
  // Since we use arm64 based OS we need to specify platform so that it may run on server
  // This image will not be able to run on your local machine.
  // To do so you need to uncomment the line below alternatively remove "--platform linux/amd64"
  execSync(`docker build --platform linux/amd64 ${buildArgs} --tag ${DOCKER_IMAGE_NAME} .`);
  // execSync(`docker build ${buildArgs} --tag ${DOCKER_IMAGE_NAME} .`);

  console.log("Upload image");
  execSync(`docker save ${DOCKER_IMAGE_NAME}:latest | ssh -C ${process.env.REMOTE_USERNAME}@${process.env.REMOTE_HOST} -p ${process.env.REMOTE_PORT} docker load`);

  console.log("Connect to server:", process.env.REMOTE_HOST);
  ssh.connect({
    host: process.env.REMOTE_HOST,
    port: process.env.REMOTE_PORT,
    username: process.env.REMOTE_USERNAME,
    password: process.env.REMOTE_PASSWORD,
  }).then(async () => {

    console.log(`Stop current container (${DOCKER_CONTAINER_NAME}_live)`);
    await ssh.execCommand(`docker stop ${DOCKER_CONTAINER_NAME}_live`, sshCommandOptions);

    console.log(`Remove old container (${DOCKER_CONTAINER_NAME}_old)`);
    await ssh.execCommand(`docker remove ${DOCKER_CONTAINER_NAME}_old`, sshCommandOptions);

    console.log(`Rename current container (${DOCKER_CONTAINER_NAME}_live => ${DOCKER_CONTAINER_NAME}_old)`);
    await ssh.execCommand(`docker rename ${DOCKER_CONTAINER_NAME}_live ${DOCKER_CONTAINER_NAME}_old`, sshCommandOptions);

    console.log(`Create new container (${DOCKER_CONTAINER_NAME}_live)`);
    await ssh.execCommand(`docker create -p ${DOCKER_EXTERNAL_PORT}:3000 --name ${DOCKER_CONTAINER_NAME}_live --restart unless-stopped ${DOCKER_IMAGE_NAME}`, sshCommandOptions);

    console.log(`Start new container (${DOCKER_CONTAINER_NAME}_live)`);
    await ssh.execCommand(`docker start ${DOCKER_CONTAINER_NAME}_live`, sshCommandOptions);
  });

  const end = Date.now();
  console.log("Deploy successful!");
  console.log(`Deploy time: ${(end - start) / 1000} sek`);
} catch (error) {
  console.log("#############################################");
  console.log("# An error ocurred whilst deploying docker! #");
  console.log("#############################################");
  console.log();
  console.log(error);
  throw new Error("An error ocurred whilst deploying docker");
}
