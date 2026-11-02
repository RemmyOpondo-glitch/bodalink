const { spawn } = require("child_process");

const children = [
  spawn(process.execPath, ["server.js"], { stdio: "inherit" }),
  spawn(process.execPath, ["mobile-api/server.js"], { stdio: "inherit" }),
];

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
for (const child of children) {
  child.on("error", error => {
    console.error("Could not start a BodaLink server:", error.message);
    shutdown();
  });
  child.on("exit", (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`A BodaLink server exited with code ${code}.`);
      shutdown();
    }
  });
}
