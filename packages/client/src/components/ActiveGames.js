// ActiveGames.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {Button, Text, Box, Icon, useColorModeValue} from '@chakra-ui/react';
import socket from "../Socket.js";
import { GiChessQueen } from "react-icons/gi";

const ActiveGames = (props) => {
    const [activeGames, setActiveGames] = useState([]);
    const navigate = useNavigate();
    const primaryButton = useColorModeValue("primary-light", "primary-dark");

    useEffect(() => {
        socket.on('active_games', (activeGames) => {
            setActiveGames(activeGames);
            console.log('active_games', activeGames)
        });
        return () => {
            socket.off('active_games');
        }
    }, []);

    useEffect(() => {
        socket.emit('get_active_Games', ({activeGames}) => {
            setActiveGames(activeGames);
        });
    }, [props.refreshKey]);


    const handleButtonClick = (gameId) => {
        navigate(`/game/${gameId}`);
    };

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
