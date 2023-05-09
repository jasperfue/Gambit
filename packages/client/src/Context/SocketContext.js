import {io} from "socket.io-client";
import React, {useContext, useEffect, useState, createContext} from "react";
import {AccountContext} from "./AccountContext.js";


export const SocketContext = createContext();

function SocketConnectionContext({children}) {
    const [socket, setSocket] = useState(null);
    const {user} = useContext(AccountContext);

    /**
     * New socket connection every time the user changes.
     */
    useEffect(() => {
        if(user.loggedIn !== null) {
            if(socket) {
                socket.disconnect();
            }
            setSocket(new io(process.env.REACT_APP_SOCKET_URL, {
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