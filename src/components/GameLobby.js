import React, {useEffect, useState} from "react";
import {Navigate, Routes, Route, redirect} from 'react-router-dom';
import ChessGame from "./ChessGame.js";
import StartGame from "../onboard/StartGame.js";

const GameLobby = (props) => {
    const [userName, setUserName] = useState('');
    const [foundPlayer, setFoundPlayer] = useState(false);
    const [socket, setSocket] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [opponent, setOpponent] = useState('');
    const [startGame, setStartGame] = useState(false);

    useEffect(() => {
        setUserName(props.userName);
        setSocket(props.socket);
    },[]);

    useEffect(() => {
        if(!socket || !(userName.length > 0))  return;
            socket.emit('find_game', userName);
            socket.on('joinedGame', (opponent, roomId) => {
                console.log("Partie gefunden: " + roomId + " gegner: " + opponent);
                setRoomId(roomId);
                setOpponent(opponent);
                setFoundPlayer(true);
            })
    }, [socket, userName]);

    useEffect(() => {
        if(foundPlayer && roomId.length > 0 && opponent.length > 0) {
            setStartGame(true);
            props.setIsIngame(true);
        }
    }, [foundPlayer, roomId, opponent]);




    return (
        <>
            {startGame ?
                <ChessGame socket={socket} userName={userName} opponent={opponent}/>
                :
                <div>
                    <p>Waiting for opponent...</p>
                </div>
            }
                </>
    )
}

export default GameLobby