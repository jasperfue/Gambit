const { spawn } = require('child_process');
const PORT = process.env.PORT || 3000;
process.env.CLIENT_PORT = PORT;


const reactScripts = spawn('node', ['node_modules/react-scripts/scripts/start.js', `${PORT}`]);
const socketServer = spawn('node', ['server/socketServer.js', `${PORT}`]);

reactScripts.stdout.on('data', (data) => {
    console.log(`React: ${data}`);
});

socketServer.stdout.on('data', (data) => {
    console.log(`Socket: ${data}`);
});

reactScripts.stderr.on('data', (data) => {
    console.error(`React: ${data}`);
});

socketServer.stderr.on('data', (data) => {
    console.error(`Socket: ${data}`);
});
