import React, {useEffect, useState, useContext} from "react";
import { Chessground } from 'chessground';
import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'
import {onEnPassent, refreshBoard, getValidMoves, charPieceToString} from "../Chess/ChessLogic.js";
import {Chess} from 'chess.js';
import ReactChessClock from "./ReactChessClock.js";
import {AccountContext} from "../AccountContext.js";
import socket from "../Socket.js";
import {useLocation, useParams} from "react-router-dom";
import PromotionModal from "./PromotionModal.js";

const ChessGame = () => {
    const {user} = useContext(AccountContext);
    const [whitePlayer, setWhitePlayer] = useState('');
    const [blackPlayer, setBlackPlayer] = useState('');
    const [orientation, setOrientation] = useState('');
    const {roomId} = useParams();
    const [selectVisible, setSelectVisible] = useState(false);
    const [chess, setChess] = useState(new Chess());
    const [ground, setGround] = useState(null);
    const [promotionMove, setPromotionMove] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState('');
    const [spectator, setSpectator] = useState(false);
    const [timeMode, setTimeMode] = useState(null);
    const [startingTimeWhite, setStartingTimeWhite] = useState(0);
    const [startingTimeBlack, setStartingTimeBlack] = useState(0);
    const [currentChessClockState, setCurrentChessClockState] = useState('');
    const [remainingTimeWhite, setRemainingTimeWhite] = useState(null);
    const [remainingTimeBlack, setRemainingTimeBlack] = useState(null);
    const location = useLocation();

    let queen = '';
    let bishop = '';
    let knight = '';
    let rook = '';

    //löscht location.state beim neu laden
    window.history.replaceState({}, document.title)

    useEffect(() => {
        console.log('erste')
        if(!socket.connected) {
            console.log('connect')
            socket.connect();
        }
            console.log('getData');
            socket.emit('get_game_data', roomId, ({done, data, errMsg}) => {
                if (done) {
                    console.log(data);
                    setCurrentChessClockState(data.currentState);
                    setWhitePlayer(data.whitePlayer);
                    setBlackPlayer(data.blackPlayer);
                    setTimeMode(JSON.parse(data.time));
                    chess.loadPgn(data.pgn);
                    if (data.whitePlayer !== user.username && data.blackPlayer !== user.username) {
                        setOrientation("white");
                        setSpectator(true);
                    } else if (data.whitePlayer === user.username) {
                        setOrientation("white");
                    } else {
                        setOrientation("black");
                    }
                    if (data.currentState.includes('s')) {
                        setStartingTimeWhite(data.currentStartingTimer.startingTimeWhite);
                        setStartingTimeBlack(data.currentStartingTimer.startingTimeBlack);
                    } else if (data.currentState.includes('t')) {
                        setRemainingTimeWhite(data.currentTimes.remainingTimeWhite);
                        setRemainingTimeBlack(data.currentTimes.remainingTimeBlack);
                    }
                    setInitialized(true);
                } else {
                    if(location.state) {
                        console.log(location.state);
                        setWhitePlayer("guest");
                        setBlackPlayer("guest");
                        if(location.state.playerColourIsWhite) {
                            setOrientation("white");
                        } else {
                            setOrientation("black");
                        }
                        setTimeMode(location.state.time);
                        setCurrentChessClockState("sw");
                        let startingTime;
                        switch (location.state.time.type) {
                            case "Bullet" : startingTime = 15; break;
                            case "Blitz" : startingTime = 20; break;
                            case "Rapid" : startingTime = 30; break;
                            case "Classical" : startingTime = 45; break;
                            default : startingTime = 20; break;
                        }
                        setStartingTimeBlack(startingTime);
                        setStartingTimeWhite(startingTime);
                        setInitialized(true);
                    } else {
                        console.log(errMsg)
                        setError(errMsg);
                    }
                }
            })
    }, [socket.connected]);


    useEffect(() => {
        if(initialized) {
                setGround(new Chessground(document.getElementById(roomId), {
                    fen: chess.fen(),
                    orientation: orientation,
                    viewOnly: spectator,
                    movable: {
                        free: false,
                        color: orientation,
                        dests: getValidMoves(chess),
                        showdests: true
                    },
                    animation: {
                        enabled: true,
                        duration: 400
                    }
                }));
        }

    }, [initialized]);

    useEffect(() => {
        if(ground) {
            ground.set({
                movable: {
                    events: {
                        after: onMove(ground, chess)
                    }
                }
            });
            refreshBoard(ground, chess);
            socket.on('opponentMove', (move) => {
                console.log(move);
                if(move.flags.includes('p')) {
                    onOpponentPromotion(move);
                    return;
                }
                ground.move(move.from, move.to);
                chess.move(move);
                if(move.flags.includes('e')) {
                    onEnPassent(ground, move);
                }
                refreshBoard(ground, chess);
                ground.playPremove();
            });

        }
    }, [ground]);

    function onMove() {
        return (orig, dest) => {
            if(((orientation === 'white' && dest.includes('8')) || (orientation === 'black' && dest.includes('1'))) && chess.get(orig).type === 'p') { //Promotion
                setSelectVisible(true);
                console.log("PROMOTION");
                setPromotionMove([orig, dest]);
                return;
            }
            var move = chess.move({from: orig, to: dest});
            console.log('emit_new_move');
            socket.emit('newMove', move, ({done, errMsg}) => {
                console.log(done);
                if(!done) {
                    console.log(errMsg);
                }
            });
            if(move.flags.includes('e')) {
                onEnPassent(ground, move);
            }
            refreshBoard(ground, chess);
        };
    }

    function promotion(toPiece) {
        var move = chess.move({from: promotionMove[0], to: promotionMove[1], promotion: toPiece});
        ground.state.pieces.set(promotionMove[1], {
            role: charPieceToString(toPiece),
            color: parseInt(promotionMove[1].split('')[1]) === 8 ? 'white' : 'black',
            promoted: true
        });
        socket.emit('newMove', move, ({done, errMsg}) => {
            if(done) {
                console.log('promotion successful');
            } else {
                console.log(errMsg);
            }

        });
        setPromotionMove([]);
        setSelectVisible(false);
        refreshBoard(ground, chess);
    }

    function onOpponentPromotion(move) {
        chess.move({from: move.from, to: move.to, promotion: move.promotion})
        ground.move(move.from, move.to);
        ground.state.pieces.set(move.to.toString(), {
            role: charPieceToString(move.promotion),
            color: parseInt(move.to.split('')[1]) === 8 ? 'white' : 'black',
            promoted: true
        });
        refreshBoard(ground, chess);
        ground.playPremove();
    }



    return (
        <>
            {initialized === true ?
                <>
                {user.loggedIn ?
                        (<h1>Hey {user.username},</h1>)
                        :
                        (<h1>Hey Guest,</h1>)
                }
                    {orientation === "white"
                    ? <>
                            <h1>{blackPlayer}</h1>
                            <p id='blackStartingTime' />
                            </>
                    : <>
                            <h1>{whitePlayer}</h1>
                            <p id='whiteStartingTime' />
                            </>
                    }
                <div style={{display: "flex", flexDirection:"row", alignItems:"center"}}>
                <div id={roomId} style={{width:'80VH', height:'80VH'}}/>
                <div style={{margin: '10VH'}}>
                <ReactChessClock currentState={currentChessClockState} remainingTimeWhite={remainingTimeWhite}
                                 remainingTimeBlack={remainingTimeBlack} time={timeMode} startingTimeWhite={startingTimeWhite}
                                 startingTimeBlack={startingTimeBlack} orientation={orientation} socket={socket}/>
                </div>
                </div>
                    {orientation === "white"
                        ? <>
                            <h1>{whitePlayer}</h1>
                            <p id='whiteStartingTime' />
                        </>
                        : <>
                            <h1>{blackPlayer}</h1>
                            <p id='blackStartingTime' />
                        </>
                    }
                    <PromotionModal isVisible={selectVisible} colour={orientation} promotion={promotion} />
                    </>
            :
                <>
                    {error === "" ?
                        <h1> LOADING... </h1>
                    :
                        <>
                        <h1>{error}</h1>
                        <p> Note: We only support watching games of logged In Users.</p>
                            </>
                    }
                    </>}

        </>
    )
}

export default ChessGame