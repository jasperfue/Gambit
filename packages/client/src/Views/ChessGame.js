import React, {useEffect, useState, useContext, useCallback} from "react";
import { Chessground } from 'chessground';
import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'
import {onEnPassent, refreshBoard, getValidMoves, charPieceToString} from "../Utils/ChessLogic.js";
import {Chess} from 'chess.js';
import ChessClock from "../Components/ChessClock.js";
import {AccountContext} from "../Context/AccountContext.js";
import {useLocation} from "react-router-dom";
import PromotionModal from "../Components/PromotionModal.js";
import {Alert, AlertIcon, AlertTitle, AlertDescription, Box, VStack, Flex, useColorModeValue, Heading, useToast, Button, Icon} from "@chakra-ui/react";
import Chat from "../Components/Chat.js";
import {SocketContext} from "../Context/SocketContext.js";
import { BsClock } from "react-icons/bs";
import {useParams} from "react-router";

const ChessGame = () => {
    const {user} = useContext(AccountContext);
    const {socket} = useContext(SocketContext);
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
    const toast = useToast();
    const button = useColorModeValue("start-game-light", "start-game-dark");
    const [oldMessages, setOldMessages] = useState([]);




    const getGameData = useCallback(() => {
        socket.emit('get_game_data', roomId, ({ done, data, errMsg }) => {
            if (done) {
                setCurrentChessClockState(data.currentState);
                setWhitePlayer(data.whitePlayer);
                setBlackPlayer(data.blackPlayer);
                setTimeMode(JSON.parse(data.time));
                chess.loadPgn(data.pgn);
                setOldMessages(JSON.parse(data.chat));
                if (data.whitePlayer !== user.username && data.blackPlayer !== user.username) {
                    if (location.state?.client === data.whitePlayer) {
                        setOrientation("white");
                    } else if (location.state?.client === data.blackPlayer) {
                        setOrientation("black");
                    } else {
                        setOrientation("white");
                        setSpectator(true);
                    }
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
                setError(errMsg);
            }
        });
    }, [socket, roomId]);


    useEffect(() => {
        getGameData();
        return () => {
            socket.emit('leaveRoom', roomId);
        };
    }, [socket, roomId]);


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

            socket.on('Stalemate', () => {
                toast({
                    title: 'Stalemate',
                    status: 'warning',
                    position: 'top',
                    isClosable: true
                });
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
            socket.off('Stalemate');
            socket.off('Time_Over');
            socket.off('Cancel_Game');
            socket.off('resigned');
        }
    }, [socket, ground, initialized, ground, chess, orientation, whitePlayer, blackPlayer]);

    const onMove = useCallback(() => {
        return (orig, dest) => {
            if(((orientation === 'white' && dest.includes('8')) || (orientation === 'black' && dest.includes('1'))) && chess.get(orig).type === 'p') { //Promotion
                setSelectVisible(true);
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
            socket.emit('newMove',roomId, player, move, ({done, errMsg}) => {
                if(!done) {
                    console.log(errMsg);
                }
            });
            if(move.flags.includes('e')) {
                onEnPassent(ground, move);
            }
            refreshBoard(ground, chess);
        };
    }, [socket, chess, socket, roomId, ground, orientation]);


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
    }, [navigator.share]);


    return (
        <>
            <Flex
                width="100vw"
                alignItems="stretch"
                justifyContent="center"
                paddingTop="3vh"
                flexDirection="row"
            >
                    {initialized === true ? (
                        <>
                        <Box
                            backgroundColor={bg}
                            borderRadius="md"
                            p={6}
                            boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <div id={roomId} style={{ width: '75VH', height: '75VH' }} />
                                <VStack justifyContent="center" alignItems="center" m={10} spacing={4} >
                                    <Box display="flex" alignItems="center">
                                        <Icon as={BsClock} boxSize={6} marginRight={2} />
                                        <Heading as="h3" size="sm" marginBottom="1">{timeMode.string}</Heading>
                                    </Box>
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
                                    <ChessClock
                                        currentState={currentChessClockState}
                                        remainingTimeWhite={remainingTimeWhite}
                                        remainingTimeBlack={remainingTimeBlack}
                                        time={timeMode}
                                        startingTimeWhite={startingTimeWhite}
                                        startingTimeBlack={startingTimeBlack}
                                        orientation={orientation}
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
                                    {!spectator || navigator.share ?
                                        <Box display="flex" justifyContent="center" marginTop={4}>
                                            {!spectator && (
                                                <Button variant={button} onClick={resign} marginRight={2}>
                                                    Resign
                                                </Button>
                                            )}
                                            {navigator.share && (
                                                <Button variant={button} onClick={shareUrl}>
                                                    Share
                                                </Button>
                                            )}
                                        </Box>
                                        :
                                        <> </>
                                    }

                                </VStack>
                            </div>
                            <PromotionModal
                                isVisible={selectVisible}
                                colour={orientation}
                                promotion={promotion}
                            />

                        </Box>
                            <Box
                                marginLeft={4}
                                backgroundColor={bg}
                                borderRadius="md"
                                p={6}
                                boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                                minWidth="350px"
                                maxWidth="350px"
                                display="flex"
                                flexDirection="column"
                                justifyContent="space-between"
                            >
                                <Chat roomId={roomId} spectator={spectator} oldMessages={oldMessages} guestName={location.state?.client} />
                            </Box>
                        </>
                    ) : error === '' ? (
                        <Box
                        backgroundColor={bg}
                        borderRadius="md"
                        p={6}
                        boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                    >
                        <h1> LOADING... </h1>
                        </Box>
                    ) : (
                        <Box
                            backgroundColor={bg}
                            borderRadius="md"
                            p={6}
                            boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                        >
                            <Alert status="warning" borderRadius="md">
                                <AlertIcon />
                                <AlertTitle>{error}</AlertTitle>
                            </Alert>
                        </Box>
                    )}
            </Flex>
        </>
    );

}

export default ChessGame