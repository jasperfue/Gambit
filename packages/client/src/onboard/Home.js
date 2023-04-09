import React, {useCallback, useContext, useEffect, useState} from "react";
import {AccountContext} from "../AccountContext.js";
import { useNavigate, useLocation } from "react-router-dom";
import {Flex, Heading, Grid, GridItem, Button, Spinner, Box, Text,  useColorModeValue} from "@chakra-ui/react";
import FriendList from "../components/FriendList.js";
import ActiveGames from "../components/ActiveGames.js";
import {SocketContext} from "../App.js";

const Home = () => {
    const {socket} = useContext(SocketContext);
    const {user} = useContext(AccountContext);
    const [time, setTime] = useState(null);
    const navigate = useNavigate();
    const [logOutError, setLogOutError] = useState('');
    const equity = useColorModeValue("white", "purple.500");
    const button = useColorModeValue("start-game-light", "start-game-dark");
    const location = useLocation();
    const [refreshKey, setRefreshKey] = useState(0);
    const times = [
        {type: 'Bullet', minutes: 1, increment: 0, string: '1 + 0'},
        {type: 'Bullet', minutes: 2, increment: 1, string: '2 + 1'},
        {type: 'Blitz', minutes: 3, increment: 0, string: '3 + 0'},
        {type: 'Blitz', minutes: 3, increment: 2, string: '3 + 2'},
        {type: 'Blitz', minutes: 5, increment: 0, string: '5 + 0'},
        {type: 'Blitz', minutes: 5, increment: 3, string: '5 + 3'},
        {type: 'Rapid', minutes: 10, increment: 0, string: '10 + 0'},
        {type: 'Rapid', minutes: 10, increment: 5, string: '10 + 5'},
        {type: 'Rapid', minutes: 15, increment: 10, string: '15 + 10'},
        {type: 'Classical', minutes: 30, increment: 0, string: '30 + 0'},
        {type: 'Classical', minutes: 30, increment: 20, string: '30 + 20'}
    ];

    const refreshData = () => {
        setRefreshKey((prevKey) => prevKey + 1);
    };



    useEffect(() => {
        refreshData();
    }, [location.pathname]);

    useEffect(() => {
        console.log('home');
        socket.connect();
        socket.on('connect_error', (err => {
            console.log('err');
            console.log(err);
        }));
        return () => {
            socket.off('connect_error');
        }
    }, []);

    useEffect(() => {
        if(time !== null) {
            socket.emit('find_game', user, time);
            socket.on('joinedGame', (client, opponent, roomId, playerColour) => {
                console.log("Partie gefunden: " + roomId + " gegner: " + opponent);
                navigate(`game/${roomId}`, {
                    state: {
                        client: client,
                        opponent: opponent,
                        playerColourIsWhite: playerColour,
                        time: time
                    }
                });
            });
            return () => {
                socket.off('joinedGame');
            }
        }
    }, [time]);



    const cancelGame = useCallback(() => {
        socket.emit('leave_queue', time);
        setTime(null);
    }, [socket, time]);

    return (
        <>
            <Flex align="flex-start" justify="center" direction="row" height="80 vh" paddingTop="10">
                <Box backgroundColor={equity} borderRadius="md" p={6} boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)">
            {time === null ?
                <>
                    {user.loggedIn === true ?
                    <> </>
                    :
                    <Heading as="h2" size='lg' marginBottom="4"> Play as a guest </Heading>
                    }
                    <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                        {times.map((time, index) => (
                            <Button
                                key={index}
                                variant={button}
                                minW="8rem"
                                minH="4rem"
                                onClick={() => setTime(time)}
                            >
                                {time.string}
                            </Button>
                        ))}
                    </Grid>
                </>
                :
                <Flex align="center" justify="center" direction="column">
                    <Text marginBottom="5">Waiting for opponent...</Text>
                    <Spinner size="lg" marginBottom="5" />
                    <Button variant={button} onClick={cancelGame}>Cancel</Button>
                </Flex>
            }
                    </Box>

            {user.loggedIn === true ?
                <>
                    <Box backgroundColor={equity} borderRadius="md" marginLeft={3} p={6} boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)">
                        <Text marginBottom={1} fontSize="1.2rem"> Active Games: </Text>
                        <ActiveGames refreshKey={refreshKey}/>
                        <Text marginTop={5} fontSize="1.2rem"> Friends: </Text>
                        <FriendList refreshKey={refreshKey} times={times}/>
                    </Box>
                </>
                :
                <>
                    </>
                    }

            </Flex>
        </>
    )
}

export default Home;