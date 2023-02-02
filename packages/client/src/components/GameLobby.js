import React, {useEffect, useState, useContext} from "react";
import {AccountContext} from "../AccountContext.js";
import socket from "../Socket.js"
import {useNavigate} from "react-router";

const GameLobby = (props) => {
    const {user} = useContext(AccountContext);
    const navigate = useNavigate();

    useEffect(() => {
        socket.connect();
        socket.on('connect_error', (err) => {
            console.log(err);
        });
        socket.on('connect', () => {
            socket.emit('find_game', user, props.time);
            socket.on('joinedGame', (opponent, roomId, playerColour) => {
                console.log("Partie gefunden: " + roomId + " gegner: " + opponent);
                navigate(`game/${roomId}`, {
                    state: {
                        player1: user,
                        opponent: opponent,
                        playerColourIsWhite: playerColour,
                        time: props.time
                    }
                });
            });
        });
            return () => {
                socket.off('joinedGame');
                socket.off('connect');
                socket.off("connect_error");
            }
    }, []);

    const cancelGame = () => {
        socket.emit('leave_queue');
        props.setTime(null);
    }


    return (
        <>
        <p>Waiting for opponent...</p>
            <button onClick={cancelGame}>Cancel</button>
            </>
    )
}

export default GameLobby;