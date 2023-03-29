// ActiveGames.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {Button, Text, useColorModeValue} from '@chakra-ui/react';
import socket from "../Socket.js";

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
        {activeGames.length === 0 ?
        <Text> No active Games </Text>
        :
                <>
                    {activeGames.map((gameId, index) => (
                        <Button
                            key={index}
                            onClick={() => handleButtonClick(gameId)}
                            marginBottom={2}
                            variant={primaryButton}
                        >
                            Back to Game
                        </Button>
                    ))}
                </>
        }
        </>

    );
};

export default ActiveGames;
