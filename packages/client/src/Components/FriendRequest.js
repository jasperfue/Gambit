import React, {useState, useContext, useCallback} from 'react';
import { HStack, Text, Button } from '@chakra-ui/react';
import {SocketContext} from "../Context/SocketContext.js";

const FriendRequest = (props) => {
    const {socket} = useContext(SocketContext);
    const [error, setError] = useState('');

    const acceptFriendRequest = useCallback(() => {
        socket.emit('accept_friend_request', props.request, ({ errMsg, done, newFriend }) => {
            if (done) {
                props.setFriendRequests((friendRequests) =>
                    friendRequests.filter((request) => request !== props.request),
                );
                props.setFriends((friends) => [newFriend, ...friends]);
            } else {
                setError(errMsg);
            }
        });
    }, [socket, props.request, props.setFriends, props.setFriendRequests]);

    const declineFriendRequest = useCallback(() => {
        socket.emit('decline_friend_request', props.request, ({ errMsg, done }) => {
            if (done) {
                props.setFriendRequests((friendRequests) =>
                    friendRequests.filter((request) => request !== props.request),
                );
            } else {
                setError(errMsg);
            }
        });
    }, [socket, props.request, props.setFriendRequests]);

    return (
        <>
            <Text color="red">{error}</Text>
            <HStack spacing={4}>
                <Text>{props.request}</Text>
                <Button colorScheme="green" onClick={() => acceptFriendRequest()}>
                    Accept
                </Button>
                <Button colorScheme="red" onClick={() => declineFriendRequest()}>
                    Decline
                </Button>
            </HStack>
        </>
    );
};

export default FriendRequest;
