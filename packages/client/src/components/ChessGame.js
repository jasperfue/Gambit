import React, {useEffect, useState, useContext, useCallback} from "react";
import { Chessground } from 'chessground';
import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'
import {onEnPassent, refreshBoard, getValidMoves, charPieceToString} from "../Chess/ChessLogic.js";
import {Chess} from 'chess.js';
import ReactChessClock from "./ReactChessClock.js";
import {AccountContext} from "../AccountContext.js";
import socket from "../Socket.js";
import {useFetcher, useLocation, useParams} from "react-router-dom";
import PromotionModal from "./PromotionModal.js";
import {Alert, AlertIcon, AlertTitle, AlertDescription, Box, VStack, Flex, useColorModeValue, Heading, useToast, Button} from "@chakra-ui/react";

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
    const bg = useColorModeValue("white", "purple.500");
    const toast = useToast()
    const button = useColorModeValue("start-game-light", "start-game-dark");
    const [isGuestGame, setIsGuestGame] = useState(null);


    window.history.replaceState({}, document.title)


    const getGameData = useCallback(() => {
        socket.emit('get_game_data', roomId, ({ done, data, errMsg }) => {

            console.log({done, data, errMsg});
            if (done) {
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
                setIsGuestGame(false);
                setInitialized(true);
            } else {
                if (location.state) {
                    console.log(location.state);
                    if (location.state.playerColourIsWhite) {
                        setWhitePlayer(location.state.client);
                        setBlackPlayer(location.state.opponent);
                        setOrientation("white");
                    } else {
                        setOrientation("black");
                        setBlackPlayer(location.state.client);
                        setWhitePlayer(location.state.opponent);
                    }
                    setTimeMode(location.state.time);
                    setCurrentChessClockState("sw");
                    let startingTime;
                    switch (location.state.time.type) {
                        case "Bullet" :
                            startingTime = 15;
                            break;
                        case "Blitz" :
                            startingTime = 20;
                            break;
                        case "Rapid" :
                            startingTime = 30;
                            break;
                        case "Classical" :
                            startingTime = 45;
                            break;
                        default :
                            startingTime = 20;
                            break;
                    }
                    setStartingTimeBlack(startingTime);
                    setStartingTimeWhite(startingTime);
                    setIsGuestGame(true);
                    console.log("IS GUEST GAME TRUE");
                    setInitialized(true);
                } else {
                    console.log(errMsg)
                    setError(errMsg);
                }
            }
        });
    }, [roomId]);



    useEffect(() => {
        if (socket.connected) {
            getGameData();
        } else {
            socket.on('connect', () => {
                getGameData();
            });
            socket.connect();
        }
        return () => {
            socket.off('connect');
        };
    }, []);


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
        // Diese Funktion wird aufgerufen, wenn die Komponente unmountet wird
        return () => {
            if (socket) {
                socket.emit('leaveRoom', roomId);
                console.log("LEAVE ROOM");
            }
        };
    }, [socket, roomId]);

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
                console.log("Nur ein mal pro Move", move);
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
            console.log('Listener initialisiert')
            socket.on('Cancel_Game', () => {
                ground.set({viewOnly: true});
                toast({
                    title: "Canceled Game",
                    description: "Starting Clock over",
                    status: 'warning',
                    position: 'top',
                    isClosable: true
                });
            });

            socket.on('Time_Over', (color) => {
                console.log(`TIME OVER ${roomId}`);
                ground.set({viewOnly: true});
                if(color === orientation) {
                    toast({
                        title: 'Losing on time',
                        description: color === 'white' ? `${blackPlayer} wins!` : `${whitePlayer} wins!`,
                        status: 'error',
                        position: 'top',
                        isClosable: true
                    });
                } else {
                    toast({
                        title: 'Winning on time',
                        description: color === 'white' ? `${blackPlayer} wins!` : `${whitePlayer} wins!`,
                        status: 'success',
                        position: 'top',
                        isClosable: true
                    });
                }
            });

            socket.on('Checkmate', (winner) => {
                ground.set({viewOnly: true});
                console.log("Winner: " + winner);
                if(orientation === 'white') {
                    if(winner === whitePlayer) {
                        toast({
                            title: 'Checkmate',
                            description: `${whitePlayer} wins!`,
                            status: 'success',
                            position: 'top',
                            isClosable: true
                        });
                    } else {
                        toast({
                            title: 'Checkmate',
                            description: `${blackPlayer} wins!`,
                            status: 'error',
                            position: 'top',
                            isClosable: true
                        });
                    }
                } else {
                    if(orientation === 'black') {
                        if(winner === blackPlayer) {
                            toast({
                                title: 'Checkmate',
                                description: `${blackPlayer} wins!`,
                                status: 'success',
                                position: 'top',
                                isClosable: true
                            });
                        } else {
                            toast({
                                title: 'Checkmate',
                                description: `${whitePlayer} wins!`,
                                status: 'error',
                                position: 'top',
                                isClosable: true
                            });
                        }
                    }
                }
            });

            socket.on('resigned', (color) => {
                ground.set({viewOnly: true});
                if(orientation !== color) {
                    toast({
                        title: "Opponent resigned",
                        description: color === 'white' ? `${blackPlayer} wins!` : `${whitePlayer} wins!`,
                        status: "success",
                        position: 'top',
                        isClosable: true
                    });
                } else {
                    toast({
                        title: "Resigned",
                        description: color === 'white' ? `${blackPlayer} wins!` : `${whitePlayer} wins!`,
                        status: "error",
                        position: "top",
                        isClosable: true
                    });
                }
            });

        }
        return () => {
            socket.off('opponentMove');
            socket.off('Checkmate');
            socket.off('Time_Over');
            socket.off('Cancel_Game');
            socket.off('resigned');
        }
    }, [ground, initialized, ground, chess, orientation, whitePlayer, blackPlayer]);

    const onMove = useCallback(() => {
        return (orig, dest) => {
            if(((orientation === 'white' && dest.includes('8')) || (orientation === 'black' && dest.includes('1'))) && chess.get(orig).type === 'p') { //Promotion
                setSelectVisible(true);
                console.log("PROMOTION");
                setPromotionMove([orig, dest]);
                return;
            }
            let player;
            if(orientation === 'white') {
                player = whitePlayer;
            } else {
                player = blackPlayer;
            }
            var move = chess.move({from: orig, to: dest});
            console.log('newMove');
            socket.emit('newMove',roomId, player, move, ({done, errMsg}) => {
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
    }, [chess, socket, roomId, ground, orientation]);


    const promotion = useCallback(
        (toPiece) => {
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
        },
        [socket, roomId, chess, ground, promotionMove]
    );

    const onOpponentPromotion = useCallback(
        (move) => {
            chess.move({from: move.from, to: move.to, promotion: move.promotion});
            ground.move(move.from, move.to);
            ground.state.pieces.set(move.to.toString(), {
                role: charPieceToString(move.promotion),
                color: parseInt(move.to.split('')[1]) === 8 ? 'white' : 'black',
                promoted: true
            });
            refreshBoard(ground, chess);
            ground.playPremove();
        },
        [chess, ground]
        );


    const resign = useCallback(() => {
        socket.emit('resign', orientation, roomId);
        if (ground) {
            ground.set({ viewOnly: true });
        }
        toast({
            title: "Resigned",
            status: "error",
            position: "error",
            isClosable: true
        });
    }, [orientation, roomId, socket, ground, toast]);

    const shareUrl = useCallback(() => {
        navigator.share({
            title: 'GAMBIT Chess Game',
            url: window.location.href,
        }).then(() => {
            console.log('Erfolgreich geteilt');
        }).catch(err => {
            console.error(err);
        });
    }, []);


    return (
        <>
            <Flex
                width="100vw"
                alignItems="center"
                justifyContent="center"
                paddingTop="3vh"
            >
                <Box
                    backgroundColor={bg}
                    borderRadius="md"
                    p={6}
                    boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                >
                    {initialized === true ? (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <div id={roomId} style={{ width: '75VH', height: '75VH' }} />
                                <div style={{ margin: '10VH' }}>
                                    {orientation === 'white' ? (
                                        <>
                                            <Heading as="h2" size="lg" marginBottom="2">
                                                {blackPlayer}
                                            </Heading>
                                        </>
                                    ) : (
                                        <>
                                            <Heading as="h2" size="lg" marginBottom="2">
                                                {whitePlayer}
                                            </Heading>
                                        </>
                                    )}
                                    <ReactChessClock
                                        currentState={currentChessClockState}
                                        remainingTimeWhite={remainingTimeWhite}
                                        remainingTimeBlack={remainingTimeBlack}
                                        time={timeMode}
                                        startingTimeWhite={startingTimeWhite}
                                        startingTimeBlack={startingTimeBlack}
                                        orientation={orientation}
                                        socket={socket}
                                    />
                                    {orientation === 'white' ? (
                                        <>
                                            <Heading as="h2" size="lg" marginTop="2">
                                                {whitePlayer}
                                            </Heading>
                                        </>
                                    ) : (
                                        <>
                                            <Heading as="h2" size="lg" marginTop="2">
                                                {blackPlayer}
                                            </Heading>
                                        </>
                                    )}
                                    {!spectator || (navigator.share && !isGuestGame) ?
                                        <Box display="flex" justifyContent="space-between" marginTop={4}>
                                            {!spectator && (
                                                <Button variant={button} onClick={resign}>
                                                    Resign
                                                </Button>
                                            )}
                                            {navigator.share && !isGuestGame && (
                                                <Button variant={button} onClick={shareUrl}>
                                                    Share
                                                </Button>
                                            )}
                                        </Box>
                                        :
                                        <> </>
                                    }

                                </div>
                            </div>
                            <PromotionModal
                                isVisible={selectVisible}
                                colour={orientation}
                                promotion={promotion}
                            />
                        </>
                    ) : error === '' ? (
                        <h1> LOADING... </h1>
                    ) : (
                        <>
                            <Alert status="warning" borderRadius="md">
                                <AlertIcon />
                                <AlertTitle>{error}</AlertTitle>
                                <AlertDescription>
                                    Note: We only support watching games of logged In Users.
                                </AlertDescription>
                            </Alert>
                        </>
                    )}
                </Box>
            </Flex>
        </>
    );

}

export default ChessGame