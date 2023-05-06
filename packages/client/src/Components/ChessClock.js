import React, {useEffect, useRef, useState, useContext, useCallback} from "react";
import {useColorModeValue, Flex, Box} from "@chakra-ui/react";
import {SocketContext} from "../Context/SocketContext.js";

const ChessClock = (props) => {
    const {socket} = useContext(SocketContext);
    const [timeWhite, setTimeWhite] = useState(props.remainingTimeWhite
        ? props.remainingTimeWhite.minutes * 60 + props.remainingTimeWhite.seconds
        : props.time.minutes * 60);
    const [timeBlack, setTimeBlack] = useState(props.remainingTimeBlack
        ? props.remainingTimeBlack.minutes * 60 + props.remainingTimeBlack.seconds
        : props.time.minutes * 60);
    const [orientation, setOrientation] = useState(props.orientation);
    const currentTimer = useRef(0);
    const [currentTurn, setCurrentTurn] = useState(props.currentState);
    const [startingTimeWhite, setStartingTimeWhite] = useState(props.startingTimeWhite);
    const [startingTimeBlack, setStartingTimeBlack] = useState(props.startingTimeBlack);
    const bg = useColorModeValue("gray.200", "purple.700");
    const bgStartingTimer = useColorModeValue("purple.200", "purple.200");

    const decrease = useCallback((setFunction) => {
        setFunction(seconds => {
            if (seconds === 0) {
                setCurrentTurn('off');
            } else {
                return seconds - 1;
            }
        });
    }, []);

    useEffect(() => {
        console.log('toggle');
        let setFunction = () => {
        };
        switch (currentTurn) {
            case 'tw':
                setFunction = setTimeWhite;
                console.log('tw');
                break;
            case 'tb':
                setFunction = setTimeBlack;
                break;
            case 'sw':
                setFunction = setStartingTimeWhite;
                break;
            case 'sb':
                setFunction = setStartingTimeBlack;
                break;
            default:
                console.log(currentTurn);
                return;
        }
        const id = setInterval(() => {
            if (currentTurn === 'off') {
                clearInterval(id);
                return;
            }
            decrease(setFunction);
        }, 1000);
        currentTimer.current = id;
        return () => {
            clearInterval(id);
        }
    }, [currentTurn]);

    useEffect(() => {
        socket.on('updated_time', (timeWhite, timeBlack, turn) => {
            stopClocks();
            updateTime(timeWhite, timeBlack);
            setCurrentTurn(turn);
        });
        socket.on('stop_starting_time_white', () => {
            stopClocks();
            setCurrentTurn('sb');
        });
        socket.on('stop_starting_time_black', () => {
            stopClocks();
            setCurrentTurn('tw');
        });
        socket.on('stop_clocks', () => {
            stopClocks();
            setCurrentTurn('off');
        });
        return () => {
            socket.off('updated_time');
            socket.off('startClock');
            socket.off('start_starting_Time_White');
            socket.off('start_starting_Time_Black');
            socket.off('stop_clocks');

        }
    }, [socket]);


    const stopClocks = useCallback(() => {
        if (currentTimer.current !== 0) {
            clearInterval(currentTimer.current);
            currentTimer.current = 0;
        }
    }, [currentTimer.current])

    const updateTime = useCallback((timeWhite, timeBlack) => {
        console.log(timeWhite, timeBlack);
        setTimeWhite(timeWhite.minutes * 60 + timeWhite.seconds);
        setTimeBlack(timeBlack.minutes * 60 + timeBlack.seconds);
    }, [timeWhite, timeBlack]);


    return (
        <Flex flexDirection="column">
            {orientation === 'white' ? (
                <>
                    {currentTurn.includes('s') ? <>
                        <Box backgroundColor={bgStartingTimer} textAlign="center" p={1} borderTopRadius="md" height="30px" width="90px">{startingTimeBlack}</Box>
                            <Flex backgroundColor={bg}  borderBottomRadius="md" alignItems="center" justifyContent="center" height="60px" width="90px">
                                <Box id="Black">
                                    {`${(timeBlack / 60 > 9 ? Math.trunc(timeBlack / 60) : '0' + Math.trunc(timeBlack / 60))}:${(timeBlack % 60 > 9 ? timeBlack % 60 : '0' + timeBlack % 60)}`}
                                </Box>
                            </Flex>
                        </>
                        :
                        <Flex backgroundColor={bg}  borderRadius="md" alignItems="center" justifyContent="center" height="60px" width="90px" marginTop="30px">
                            <Box id="Black">
                                {`${(timeBlack / 60 > 9 ? Math.trunc(timeBlack / 60) : '0' + Math.trunc(timeBlack / 60))}:${(timeBlack % 60 > 9 ? timeBlack % 60 : '0' + timeBlack % 60)}`}
                            </Box>
                        </Flex>
                    }
                    {currentTurn === "sw" ?
                        <>
                            <Flex backgroundColor={bg} borderTopRadius="md" marginTop="1vh" alignItems="center" justifyContent="center" height="60px" width="90px">
                                <Box id="White">
                                    {`${(timeWhite / 60 > 9 ? Math.trunc(timeWhite / 60) : '0' + Math.trunc(timeWhite / 60))}:${(timeWhite % 60 > 9 ? timeWhite % 60 : '0' + timeWhite % 60)}`}
                                </Box>
                            </Flex>
                            <Box backgroundColor={bgStartingTimer} textAlign="center" height="30px" borderBottomRadius="md" width="90px">{startingTimeWhite}</Box>
                            </>
                            :
                        <Flex backgroundColor={bg} borderRadius="md" marginTop="1vh" marginBottom="30px" alignItems="center" justifyContent="center" height="60px" width="90px">
                            <Box id="White">
                                {`${(timeWhite / 60 > 9 ? Math.trunc(timeWhite / 60) : '0' + Math.trunc(timeWhite / 60))}:${(timeWhite % 60 > 9 ? timeWhite % 60 : '0' + timeWhite % 60)}`}
                            </Box>
                        </Flex>
                    }


                </>
            ) : (
                <>
                    {currentTurn === "sw" ? <>
                        <Box backgroundColor={bgStartingTimer} textAlign="center" height="30px" borderTopRadius="md" width="90px">{startingTimeWhite}</Box>
                            <Flex backgroundColor={bg}  borderBottomRadius="md" alignItems="center" justifyContent="center" height="60px" width="90px">
                            <Box id="White">
                                {`${(timeWhite / 60 > 9 ? Math.trunc(timeWhite / 60) : '0' + Math.trunc(timeWhite / 60))}:${(timeWhite % 60 > 9 ? timeWhite % 60 : '0' + timeWhite % 60)}`}
                            </Box>
                        </Flex>
                        </>
                        :
                        <Flex backgroundColor={bg} borderRadius="md" alignItems="center" justifyContent="center" marginBottom="1vh" marginTop="30px" height="60px" width="90px">
                            <Box id="White">
                                {`${(timeWhite / 60 > 9 ? Math.trunc(timeWhite / 60) : '0' + Math.trunc(timeWhite / 60))}:${(timeWhite % 60 > 9 ? timeWhite % 60 : '0' + timeWhite % 60)}`}
                            </Box>
                        </Flex>
                    }

                    {currentTurn.includes("s") ?
                        <>
                            <Flex backgroundColor={bg} borderTopRadius="md" alignItems="center" justifyContent="center" marginTop="1vh" height="60px" width="90px">
                                <Box id="Black">
                                    {`${(timeBlack / 60 > 9 ? Math.trunc(timeBlack / 60) : '0' + Math.trunc(timeBlack / 60))}:${(timeBlack % 60 > 9 ? timeBlack % 60 : '0' + timeBlack % 60)}`}
                                </Box>
                            </Flex>
                            <Box backgroundColor={bgStartingTimer} textAlign="center" height="30px" borderBottomRadius="md" width="90px">{startingTimeBlack}</Box>
                            </>
                        :
                        <Flex backgroundColor={bg} borderRadius="md" marginTop="1vh" marginBottom="30px" alignItems="center" justifyContent="center" height="60px" width="90px">
                            <Box id="Black">
                                {`${(timeBlack / 60 > 9 ? Math.trunc(timeBlack / 60) : '0' + Math.trunc(timeBlack / 60))}:${(timeBlack % 60 > 9 ? timeBlack % 60 : '0' + timeBlack % 60)}`}
                            </Box>
                        </Flex>
                            }
                </>
            )}
        </Flex>
    );

}
export default ChessClock;