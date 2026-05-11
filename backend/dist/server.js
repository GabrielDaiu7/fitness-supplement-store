"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const init_1 = require("./db/init");
const PORT = Number(process.env.PORT ?? 4000);
async function startServer() {
    await (0, init_1.initSchema)();
    const app = (0, app_1.createApp)();
    app.listen(PORT, () => {
        console.log(`API running at http://localhost:${PORT}`);
    });
}
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exitCode = 1;
});
