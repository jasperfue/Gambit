// ActiveGames.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@chakra-ui/react';
import socket from "../Socket.js";

const ActiveGames = () => {
    const [activeGames, setActiveGames] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        socket.emit('get_active_Games', ({activeGames}) => {
            setActiveGames(activeGames);
        });
        socket.on('active_games', (activeGames) => {
            setActiveGames(activeGames);
        });
    }, []);

    const handleButtonClick = (gameId) => {
        navigate(`/game/${gameId}`);
    };

    return (
        <>
        {activeGames.length === 0 ?
        <> </>
        :
                <div>
                    {activeGames.map((gameId, index) => (
                        <Button
                            key={index}
                            onClick={() => handleButtonClick(gameId)}
                            m={2}
                            colorScheme="blue"
                        >
                            Spiel {gameId}
                        </Button>
                    ))}
                </div>
        }
        </>

    );
};

export default ActiveGames;
