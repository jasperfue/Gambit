import React, {useCallback, useEffect, useState} from 'react';
import {
    HStack,
    Box,
    Text,
    useColorModeValue,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Icon,
    SimpleGrid,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    Spinner,
    VStack,
    Button, useToast,
    Flex
} from '@chakra-ui/react';
import { useNavigate } from "react-router";
import { GiChessQueen, GiSwordsEmblem } from "react-icons/gi";
import {ViewIcon} from "@chakra-ui/icons";
import socket from "../Socket.js";

const Friend = (props) => {
    const green = useColorModeValue('green.500', 'green.400');
    const red = useColorModeValue('red.500', 'red.400');
    const navigate = useNavigate();
    const [activeGames, setActiveGames] = useState(props.friend.activeGames);
    const menuList = useColorModeValue("white", "purple.900");
    const hover = useColorModeValue("gray.200", "purple.600");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const toast = useToast();


    const cancelGameRequest = useCallback(() => {
        setIsModalOpen(false);
        socket.emit('cancel_game_request', props.friend.username);
    }, []);

    const sendGameRequest = useCallback(
        (time) => {
        socket.emit('send_game_Request', props.friend, time, ({accepted, roomId}) => {
            if(accepted) {
                handleGameRequestAccepted(roomId);
            } else {
                handleGameRequestDenied();
            }
        });
        setIsModalOpen(true);
    }, [socket, props.friend]);

    const handleGameClick = (game) => {
        navigate(`/game/${game}`);
    }

    const handleGameRequestDenied = useCallback(() => {
        toast({
            title: "Game request denied",
            status: 'error',
            position: 'top',
            isClosable: true
        });
        setIsModalOpen(false);
    }, [toast])

    const handleGameRequestAccepted = useCallback((game) => {
        toast({
            title: "Game request accepted",
            status: 'success',
            position: 'top',
            isClosable: true
        });
        setIsModalOpen(false);
        navigate(`/game/${game}`);
    }, [navigate, toast, setIsModalOpen]);


    return (
        <>
        <HStack spacing={3}>
            <Box
                backgroundColor={props.friend.connected === 'true' ? green : red}
                borderRadius="50%"
                width="20px"
                height="20px"
            />
            <Flex alignItems="center">
            <Text>{props.friend.username}</Text>
                {props.friend.connected === "true" && (
                <Menu>
                    <MenuButton
                        as={IconButton}
                        icon={<GiSwordsEmblem />}
                        backgroundColor="transparent"
                        aria-label="View additional buttons"
                        marginLeft={10}
                        _hover={{
                            backgroundColor: hover,
                        }}
                    />
                    <MenuList backgroundColor={menuList} p={1} borderRadius="md">
                        <SimpleGrid columns={3} spacing={2}>
                        {props.times.map((time, index) => (
                            <MenuItem
                                key={index}
                                onClick={() => sendGameRequest(time)}
                                backgroundColor={menuList}
                                _hover={{
                                    backgroundColor: hover,
                                }}
                                borderRadius="md"
                                justifyContent="center"
                            >
                                <Box display="flex" alignItems="center">
                                    <Text mx={1}>{time.string}</Text>
                                </Box>
                            </MenuItem>
                        ))}
                        </SimpleGrid>
                    </MenuList>
                </Menu>
                )}
            {activeGames && Object.keys(activeGames).length > 0 && (
                <Menu>
                    <MenuButton
                        as={IconButton}
                        icon={<ViewIcon />}
                        backgroundColor="transparent"
                        aria-label="View active games"
                        _hover={{
                            backgroundColor: hover
                        }}
                    />
                    <MenuList backgroundColor={menuList} p={1} borderRadius="md">
                        {/* Map through the activeGames object and create menu items */}
                        {Object.keys(activeGames).map((gameId, index) => (
                            <MenuItem
                                key={index}
                                onClick={() => handleGameClick(gameId)}
                                backgroundColor={menuList}
                                _hover={{
                                    backgroundColor: hover,
                                }}
                            >
                                <Box display="flex" alignItems="center">
                                    <Icon as={GiChessQueen} color="white" />
                                    <Text mx={1}>{activeGames[gameId].whitePlayer}</Text>
                                    <Text>vs.</Text>
                                    <Text mx={1}>{activeGames[gameId].blackPlayer}</Text>
                                    <Icon as={GiChessQueen} color="black" />
                                </Box>
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            )}
            </Flex>

        </HStack>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isCentered closeOnOverlayClick={false}>
                <ModalOverlay />
                <ModalContent>
                    <VStack spacing={4} alignItems="center" justifyContent="center">
                    <ModalHeader>Waiting for {props.friend.username}</ModalHeader>
                    <ModalBody>
                        <VStack spacing={4} alignItems="center" justifyContent="center">
                            <Spinner />
                            <Button
                                backgroundColor={menuList}
                                _hover={{
                                    backgroundColor: hover,
                                }}
                                onClick={() => cancelGameRequest()}>
                                Cancel
                            </Button>
                        </VStack>
                    </ModalBody>
                    </VStack>
                </ModalContent>
            </Modal>
    </>
    );
};

export default Friend;
