import {io} from "socket.io-client";
import React, {useContext, useEffect, useState} from "react";
import {AccountContext} from "./AccountContext.js";
const {createContext} = require('react');

export const SocketContext = createContext();

function SocketConnectionContext({children}) {
    const [socket, setSocket] = useState(null);
    const {user} = useContext(AccountContext);

    useEffect(() => {
        if(user) {
            setSocket(new io("http://localhost:4000", {
                withCredentials: true
            }));
            console.log('NEUE VERBINDUNG', user);
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{socket}}>
            {children}
        </SocketContext.Provider>
    );
}

export default SocketConnectionContext;