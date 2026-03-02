import { createServer } from "http";
import { app, ready } from "./app";
import { setupVite, serveStatic, log } from "./vite";

(async () => {
  await ready;

  const server = createServer(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || '3001', 10);

  server.listen(PORT, () => {
    log(`Server running on http://localhost:${PORT}`);
  });
})();
