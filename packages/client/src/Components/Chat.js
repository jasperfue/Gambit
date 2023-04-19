import React, {useCallback, useContext, useEffect, useState} from 'react';
import {Box, VStack, Input, Button, Text, Flex, useColorModeValue} from '@chakra-ui/react';
import { BiSend } from 'react-icons/bi';
import {AccountContext} from "../Context/AccountContext.js";
import {SocketContext} from "../Context/SocketContext.js";

const Chat = ({ roomId, spectator, oldMessages, guestName }) => {
    const {socket} = useContext(SocketContext);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState(oldMessages);
    const {user} = useContext(AccountContext);
    const contrast = useColorModeValue("purple.500", "white");
    const sendButton = useColorModeValue("purple.500", "purple.700");
    const hover = useColorModeValue("purple.200", "purple.600");
    const yourMessage = useColorModeValue("purple.200", "purple.700");
    const notYourMessage = useColorModeValue("gray.200", "purple.400");


    const sendMessage = useCallback((e) => {
        e.preventDefault();
        if (message) {
            if(!user.loggedIn) {
                socket.emit('sendMessage', { message, username: guestName, roomId });
            } else {
                socket.emit('sendMessage', { message, username: user.username, roomId });
            }
            setMessage('');
        }
    }, [message, user, roomId]);

    useEffect(() => {
        socket.on('message', (data) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });
        return () => {
            socket.off('message');
        }
    }, [socket])

    return (
        <>
            <Flex
                flexDirection="column"
                justifyContent="flex-start"
                overflowY="auto"
                flex="1"
                mb="4"
                maxHeight="calc(100% - 60px)"
            >
                {messages.map((msg, index) => (
                    <Box
                        key={index}
                        borderRadius="md"
                        p={2}
                        backgroundColor={(msg.username === user.username || msg.username === guestName) ? yourMessage : notYourMessage}
                        alignSelf={(msg.username === user.username || msg.username === guestName) ? 'flex-end' : 'flex-start'}
                        marginBottom="2"
                    >
                        <Text fontWeight="bold">{msg.username}</Text>
                        <Text>{msg.message}</Text>
                    </Box>
                ))}
            </Flex>
            {!spectator && (
                <Box as="form" onSubmit={sendMessage} display="flex">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        flexGrow="1"
                        marginRight="2"
                        focusBorderColor={contrast}
                    />
                    <Button type="submit" color="white" backgroundColor={sendButton} alignItems="center" leftIcon={<BiSend />}
                    _hover={{backgroundColor: hover}}/>
                </Box>
            )}
            </>
    );
};

export default Chat;
