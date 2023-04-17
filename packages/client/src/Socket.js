import {io} from "socket.io-client";

const socket = (user) => new io("http://localhost:4000", {
    transports: ["websocket"],
    autoConnect: true,
    withCredentials: true,
    auth: {
        token: user.token
    }
});

export default socket;