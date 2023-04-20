// ActiveGames.js
import React, {useState, useEffect, useContext, useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import {Button, Text, Box, Icon, useColorModeValue} from '@chakra-ui/react';
import { GiChessQueen } from "react-icons/gi";
import {SocketContext} from "../Context/SocketContext.js";

const ActiveGames = (props) => {
    const [activeGames, setActiveGames] = useState([]);
    const navigate = useNavigate();
    const primaryButton = useColorModeValue("primary-light", "primary-dark");
    const {socket} = useContext(SocketContext);

    useEffect(() => {
        socket.on('active_games', (activeGames) => {
            setActiveGames(activeGames);
            console.log('active_games', activeGames)
        });
        return () => {
            socket.off('active_games');
        }
    }, [socket]);

    useEffect(() => {
        socket.emit('get_active_Games', ({activeGames}) => {
            setActiveGames(activeGames);
        });
    }, [socket, props.refreshKey]);


    const handleButtonClick = useCallback((gameId) => {
        navigate(`/game/${gameId}`);
    }, [navigate]);

    return (
        <>
            {Object.keys(activeGames).length === 0 ? (
                <Text> No active Games </Text>
            ) : (
                <>
                    {Object.keys(activeGames).map((gameId, index) => (
                        <Button
                            key={index}
                            onClick={() => handleButtonClick(gameId)}
                            marginBottom={2}
                            variant={primaryButton}
                        >
                            <Box display="flex" alignItems="center">
                                <Icon as={GiChessQueen} color="white" />
                                <Text mx={1}>{activeGames[gameId].whitePlayer}</Text>
                                <Text>vs.</Text>
                                <Text mx={1}>{activeGames[gameId].blackPlayer}</Text>
                                <Icon as={GiChessQueen} color="black" />
                            </Box>
                        </Button>
                    ))}
                </>
            )}
        </>
    );
};

export default ActiveGames;
