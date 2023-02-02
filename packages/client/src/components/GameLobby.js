import React, {useEffect, useState, useContext} from "react";
import ChessGame from "./ChessGame.js";
import {AccountContext} from "../AccountContext.js";
import {socket} from "../Socket.js"
import {useNavigate} from "react-router";

const GameLobby = (props) => {
    const {user} = useContext(AccountContext);
    const navigate = useNavigate();

    useEffect(() => {
        console.log(socket);
            console.log('nur ein mal');
            socket.emit('find_game', user, props.time);
            socket.on('joinedGame', (opponent, roomId, playerColour) => {
                console.log("Partie gefunden: " + roomId + " gegner: " + opponent);
                console.log('Hat geklappt');
                navigate(`game/${roomId}`, {
                    state: {
                        player1: user,
                        opponent: opponent,
                        playerColourIsWhite: playerColour
                    }
                });
            });
            /*return () => {
                socket.off('joinedGame');
            }*/
    }, []);




    return (
        <p>Waiting for opponent...</p>
    )
}

export default GameLobby;