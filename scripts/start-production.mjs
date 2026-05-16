import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";
const npxCmd = isWindows ? "npx.cmd" : "npx";
const frontendPort = process.env.PORT || "3000";
const backendPort = process.env.BACKEND_PORT || "4000";

const requiredEnv = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error("Add them in Railway Variables, then redeploy. DATABASE_URL must point to a PostgreSQL database.");
  process.exit(1);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function start(name, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  child.on("exit", (code, signal) => {
    console.error(`${name} exited`, { code, signal });
    process.exit(code ?? 1);
  });

  return child;
}

await run(npxCmd, ["prisma", "db", "push", "--skip-generate"], { cwd: "backend" });

start("backend", "node", ["dist/server.js"], {
  cwd: "backend",
  env: { ...process.env, PORT: backendPort, NODE_ENV: "production" },
});

start("frontend", npmCmd, ["run", "start", "--", "-p", frontendPort, "-H", "0.0.0.0"], {
  cwd: "frontend",
  env: {
    ...process.env,
    NODE_ENV: "production",
    API_INTERNAL_URL: process.env.API_INTERNAL_URL || `http://127.0.0.1:${backendPort}`,
  },
});
