import React, {useEffect, useState} from "react";
import { Chessground } from 'chessground';
import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'
import {onEnPassent, refreshBoard, validMoves} from "./Chess/ChessLogic.js";
import {Chess} from "chess.js";

const ChessGame = (props) => {
    const[userName, setUserName] = useState('');
    const[opponent, setOpponent] = useState('');
    const[clientSocket, setClientSocket] = useState(null);
    const[startGame, setStartGame] = useState(false);
    const [playerColourIsWhite, setPlayerColourIsWhite] = useState(undefined);
    const [roomId, setRoomId] = useState('');


    useEffect(() => {
        setUserName(props.userName);
        setOpponent(props.opponent);
        setClientSocket(props.socket);
        setPlayerColourIsWhite(props.playerColourIsWhite);
        setRoomId(props.roomId);
    },[]);

    useEffect(() => {
        if(roomId.length > 0 && startGame) {
            let colour = '';
            if(playerColourIsWhite) {
                 colour = "white";
            } else {
                colour = "black";
            }
            const chess = new Chess();
            const ground = new Chessground(document.getElementById(roomId), {
                orientation: colour,
                movable: {
                    free: false,
                    color: colour,
                    dests: validMoves(chess),
                    showdests: true
                },
                animation: {
                    enabled: true,
                    duration: 400
                }
            });
            ground.set({
                movable: {
                    events: {
                        after: onMove(ground, chess)
                    }
                }
            });
            clientSocket.on('opponentMove', (move) => {
                ground.move(move.from, move.to);
                chess.move({from: move.from, to: move.to});
                if(move.flags.includes('e')) {
                    onEnPassent(ground, move);
                }
                refreshBoard(ground, chess);
                ground.playPremove();
            });
        }
    }, [roomId, startGame])



    function onMove(ground, chess) {
        return (orig, dest) => {
            var move = chess.move({from: orig, to: dest});
            clientSocket.emit('newMove', roomId, move);
            if(move.flags.includes('e')) {
                onEnPassent(ground, move);
            }
            refreshBoard(ground, chess);
        };
    }

    useEffect(() => {
        if(clientSocket !== null && userName.length > 0 && opponent.length > 0) {
            setStartGame(true);
        }
    },[clientSocket, userName, opponent])


    return (
        <div>
        {startGame ?
            <>
                <h1>Hey {userName}</h1>
                <h1>Viel Glück gegen {opponent}</h1>
                <p>Du spielst {playerColourIsWhite ?
                "weiß"
                :
                "schwarz"}</p>
                <div id={roomId} style={{width:'80VH', height:'80VH'}}/>
            </>
                :
                    <h1>Spiel wird gestartet!</h1>
        }
        </div>
    )
}

export default ChessGame