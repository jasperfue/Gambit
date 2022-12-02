import React from "react";
import {useState, useEffect} from "react"
import StartGame from "./onboard/StartGame.js";
import GameLobby from "./components/GameLobby.js"
import { BrowserRouter, Routes, Route, useNavigate, Redirect} from "react-router-dom";
import io from "socket.io-client";

function App() {
    const [userName, setUserName] = useState('');
    const [socket, setSocket] = useState(null);
    const [isWantingToPlay, setIsWantingToPlay] = useState(false);
    const [isConnected, setConnected] = useState(false);
    const [isIngame, setIsIngame] = useState(false);


    useEffect(() => {

        setSocket(io("http://localhost:8080"));
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
    <div>
        <BrowserRouter>
        {isWantingToPlay && userName.length > 0 && isConnected ?
            <GameLobby socket={socket} userName={userName} />
            :
            <StartGame setUserName={setUserName} setIsWantingToPlay={setIsWantingToPlay} />
        }
        </BrowserRouter>
    </div>
  );
}

export default App;
