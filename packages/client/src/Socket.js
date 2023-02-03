import {io} from "socket.io-client";

const socket = io("http://localhost:4000", {
    transports: ['websocket'],
    autoConnect: false,
    withCredentials: true
});
socket.on('connection', () => {
    console.log('socket.connected')
});

export default socket;