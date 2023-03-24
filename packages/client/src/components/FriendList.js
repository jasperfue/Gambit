import React, {useEffect, useState} from 'react';
import socket from "../Socket.js";
import Friend from "./Friend.js";
import FriendRequest from "./FriendRequest.js";
import AddFriendModal from "./AddFriendModal.js";
import { VStack } from '@chakra-ui/react';

const FriendList = () => {
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);

    useEffect(() => {
        socket.emit('get_friends', ({friendList}) => {
                setFriends(friendList);
        });
        socket.on('friends', (friendList) => {
            setFriends(friendList);
        });
        socket.emit('get_friend_requests', ({requests}) => {
            setFriendRequests(requests);
        });
        socket.on('friend_requests', (requests) => {
            setFriendRequests(requests);
        });
        socket.on('friend_request', (username) => {
            setFriendRequests(prevState => [username, ...prevState]);
        });
        socket.on('connected', (status, username) => {
            setFriends(prevFriends => {
                return [...prevFriends].map(friend => {
                    if (friend.username === username) {
                        friend.connected = status;
                    }
                    return friend;
                })
            })
        });
        socket.on('friend_request_accepted', (friend) => {
            setFriends(friends =>
                [friend, ...friends]
            );
        });
        return () => {
            socket.off('friend_request');
            socket.off('connected');
            socket.off('friend_request_accepted');
            socket.off('friend_requests');
            socket.off('friends');
        }
    }, []);

    useEffect(() => {

    }, [friends]);



    return (
        <>
            <VStack spacing={3} align="start" marginTop={2} marginBottom={4}>
                {friendRequests.map(request => (
                    <FriendRequest key={request} request={request} setFriendRequests={setFriendRequests} setFriends={setFriends} />
                ))}
                {friends
                    .slice()
                    .sort((a, b) => {
                        if (a.connected === "true" && b.connected !== "true") {
                            return -1;
                        } else if (a.connected !== "true" && b.connected === "true") {
                            return 1;
                        } else {
                            return 0;
                        }
                    })
                    .map(friend => (
                        <Friend key={friend.username} friend={friend} />
                    ))}
            </VStack>

            <AddFriendModal />
        </>
    );
}

export default FriendList;