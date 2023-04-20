import {AccountContext} from "./Context/AccountContext.js";
import {Route, Routes} from "react-router-dom";
import React, {useCallback, useContext, useEffect, useState} from "react";
import Home from "./Views/Home.js"
import Login from "./Views/Login.js";
import SignUp from "./Views/SignUp.js";
import ChessGame from "./Views/ChessGame.js";
import {
    Spinner,
    Flex,
    Heading,
    useColorMode,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton, ModalBody, Center, HStack, Button
} from '@chakra-ui/react'
import {useNavigate} from "react-router";
import {SocketContext} from "./Context/SocketContext.js";

const Views = () => {
    const {user} = useContext(AccountContext);
    const [gameRequests, setGameRequests] = useState([]);
    const navigate = useNavigate();
    const {socket} = useContext(SocketContext);

    useEffect(() => {
        if (socket) {
            socket.on("game_request", (username, time) => {
                setGameRequests((prevGameRequests) => [
                    ...prevGameRequests,
                    {
                        username,
                        time
                    },
                ]);
            });
            socket.on("cancel_game_request", (username) => {
                setGameRequests((prevGameRequests) => prevGameRequests.filter(request => request.username !== username));
            });

            return () => {
                socket.off('game_request');
                socket.off('cancel_game_request');
            }
        }
    }, [socket]);


    const handleCloseModal = useCallback((index) => {
        setGameRequests((prevGameRequests) => prevGameRequests.filter((_, i) => i !== index));
    }, [gameRequests, setGameRequests]);

    const handleAccept = useCallback(
        (index) => {
            // Handle game request acceptance logic
            socket.emit('game_request_response', gameRequests[index].username, true,  (roomId) => {
                navigate(`/game/${roomId}`);
            });
            handleCloseModal(index);
        },
        [socket, handleCloseModal, gameRequests]
    );


    const handleDecline = useCallback(
        (index) => {
            // Handle game request decline logic
            socket.emit('game_request_response', gameRequests[index].username, false );
            handleCloseModal(index);
        },
        [socket, handleCloseModal, gameRequests]
    );

    return user.loggedIn === null || socket === null ?
        <Flex align="center" justify="center" direction="column" height="80 vh">
            <Heading as='h2' size='lg'>Loading...</Heading>
            <Spinner size='xl' color="purple.500" marginTop="4" />
        </Flex>

        :
        <>
            {gameRequests.map((gameRequest, index) => (
                <Modal
                    key={index}
                    isOpen={true}
                    onClose={() => handleCloseModal(index)}
                    closeOnOverlayClick={false}
                >
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Game Request</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Center>
                                Game Request from {gameRequest.username} in {gameRequest.time.string}
                            </Center>
                            <HStack mt={4} justifyContent="center" spacing="24px">
                                <Button colorScheme="green" onClick={() => handleAccept(index)}>
                                    Accept
                                </Button>
                                <Button colorScheme="red" onClick={() => handleDecline(index)}>
                                    Decline
                                </Button>
                            </HStack>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            ))}
            <Routes>
                <Route path="/" element={<Home/>} />
                <Route path="/game/:roomId" element={<ChessGame/>} />
                <Route path="/Login" element={<Login />} />
                <Route path="/SignUp" element={<SignUp  />} />
                <Route path="*" element={<Home/>} />
            </Routes>
            </>
}

export default Views;