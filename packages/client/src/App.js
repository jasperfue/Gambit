import React, {useCallback, useEffect, useState, createContext} from "react";
import UserContext, {AccountContext} from "./AccountContext.js";
import Views from "./Views.js";
import Navbar from "./components/Navbar.js";
import {
    Box,
    useColorMode,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Button,
    Center,
    HStack,
} from "@chakra-ui/react";
import socketConn from "./Socket.js";
import {useNavigate} from "react-router";
import {useContext} from "react";


export const SocketContext = createContext();

function App() {
    const [gameRequests, setGameRequests] = useState([]);
    const { colorMode } = useColorMode();
    const navigate = useNavigate();
    const {user} = useContext(AccountContext);
    const [socket, setSocket] = useState(() => socketConn(user));
    useEffect(() => {
        console.log(user);
        setSocket(() => socketConn(user));
    }, [user]);

        useEffect(() => {
            if (!socket.connected) {
                socket.connect();
            }
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
        }, []);


    const handleCloseModal = (index) => {
        setGameRequests((prevGameRequests) => prevGameRequests.filter((_, i) => i !== index));
    };

    const handleAccept = useCallback(
        (index) => {
            // Handle game request acceptance logic
            socket.emit('game_request_response', gameRequests[index].username, true,  (roomId) => {
                navigate(`/game/${roomId}`);
            });
            handleCloseModal(index);
        },
        [gameRequests]
    );


    const handleDecline = useCallback(
        (index) => {
            // Handle game request decline logic
            socket.emit('game_request_response', gameRequests[index].username, false );
            handleCloseModal(index);
        },
        [gameRequests]
    );


    useEffect(() => {
        console.log("App");
    }, []);

    return (
            <SocketContext.Provider value={{socket}}>
            <Box bg={colorMode === "light" ? "gray.200" : "purple.900"} minH="100vh">
                <Navbar />
                <Views />

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
            </Box>
            </SocketContext.Provider>
    );
}

export default App;
