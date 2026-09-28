require('dotenv').config();
const { createApp } = require('./src/app');
const { openStore } = require('./src/stores');

const port = process.env.PORT || 3000;

async function main() {
    const store = await openStore();
    const app = createApp(store);
    const server = app.listen(port, () => {
        console.log(`Server running at http://localhost:${port} (${store.kind} store)`);
    });

    const shutdown = async () => {
        console.log('Shutting down server...');
        server.close();
        await store.close();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
