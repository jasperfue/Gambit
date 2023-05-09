import React, {useContext, useEffect, useState} from 'react';
import Friend from "./Friend.js";
import FriendRequest from "./FriendRequest.js";
import AddFriendModal from "./AddFriendModal.js";
import {Text, VStack} from '@chakra-ui/react';
import {SocketContext} from "../Context/SocketContext.js";

const FriendList = (props) => {
    const {socket} = useContext(SocketContext);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);

    useEffect(() => {
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
                });
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
        }
    }, [socket]);

    useEffect(() => {
        socket.emit('get_friends', ({friendList}) => {
            setFriends(friendList);
        });

        socket.emit('get_friend_requests', ({requests}) => {
            setFriendRequests(requests);
        });
    }, [socket, props.refreshKey]);


    return (
        <>
            <VStack spacing={3} align="start" marginTop={2} marginBottom={4}>
                {friends.length === 0 ? (
                        <Text>No Friends</Text>
                    ) : (
                        <>
                            {friends
                                .slice()
                                .sort((a, b) => (a.connected === "true") - (b.connected === "true"))
                                .map((friend) => (
                                    <Friend key={friend.username} friend={friend} times={props.times} />
                                ))}
                        </>
                    )
                }

                {friendRequests.length === 0 ?
                    <> </>
                    :
                    <>
                        <Text>Friend Requests:</Text>
                        {friendRequests.map(request => (
                            <FriendRequest key={request} request={request} setFriendRequests={setFriendRequests}
                                           setFriends={setFriends}/>
                        ))}
                    </>
                }
            </VStack>

            <AddFriendModal/>
        </>
    );
}

export default FriendList;