import React from "react";
import {useState, useEffect} from "react"
import StartGame from "./onboard/StartGame.js";
import GameLobby from "./components/GameLobby.js"
import { BrowserRouter } from "react-router-dom";
import io from "socket.io-client";
import UserContext from "./AccountContext.js";
const port = 4000;


function App() {
    const [userName, setUserName] = useState('');
    const [socket, setSocket] = useState(null);
    const [isWantingToPlay, setIsWantingToPlay] = useState(false);
    const [isConnected, setConnected] = useState(false);
    const [isIngame, setIsIngame] = useState(false);
    const [time, setTime] = useState(null);


    useEffect(() => {

        setSocket(io(`http://localhost:${port}`, {
            transports: ['websocket']
        }));
    }, []);

    useEffect(() =>{
        if (!socket) return;
        socket.on('connect', () => {
            setConnected(true);
        })
    }, [socket]);

    useEffect(() => {
        if(isWantingToPlay && isIngame) {
            setIsWantingToPlay(false);
        }
    }, [isWantingToPlay, isIngame])




  return (
    <UserContext>
        <BrowserRouter>
        {isWantingToPlay && time && userName.length > 0 && isConnected ?
            <GameLobby socket={socket} userName={userName} time={time} />
            :
            <StartGame setUserName={setUserName} setIsWantingToPlay={setIsWantingToPlay} setTime={setTime} />
        }
        </BrowserRouter>
    </UserContext>
  );
}

export default App;
