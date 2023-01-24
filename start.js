const { spawn } = require('child_process');
const PORT = process.env.PORT || 3000;
//process.env.SOCKET_PORT = PORT;
process.env.SOCKET_PORT = 8080;


const reactScripts = spawn('node', ['--inspect=9229', 'node_modules/react-scripts/scripts/start.js', `${PORT}`]);
const socketServer = spawn('node', ['--inspect=9230', 'server/socketServer.js', `${PORT}`]);

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
