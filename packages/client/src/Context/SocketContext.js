import {io} from "socket.io-client";
import React, {useContext, useEffect, useState} from "react";
import {AccountContext} from "./AccountContext.js";
const {createContext} = require('react');

export const SocketContext = createContext();

function SocketConnectionContext({children}) {
    const [socket, setSocket] = useState(new io("http://localhost:4000", {
        autoConnect: false,
        withCredentials: true,
    }));
    const {user} = useContext(AccountContext);

    useEffect(() => {
        setSocket(new io("http://localhost:4000", {
            autoConnect: true,
            withCredentials: true,
        }));
    }, [user]);

    return (
        <SocketContext.Provider value={{socket}}>
            {children}
        </SocketContext.Provider>
    );
}

export default SocketConnectionContext;