import React, {useEffect, useState} from 'react';
import socket from "../Socket.js";
import Friend from "./Friend.js";
import FriendRequest from "./FriendRequest.js";
import AddFriendModal from "./AddFriendModal.js";

const FriendList = () => {
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);

    useEffect(() => {
        socket.emit('get_friends', ({friendList}) => {
                setFriends(friendList);
        });
        socket.emit('get_friend_requests', ({requests}) => {
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
        }
    }, []);

    return (
        <>
            <AddFriendModal />
            {friendRequests.map(request => (
                <FriendRequest key={request} request={request} setFriendRequests={setFriendRequests} setFriends={setFriends} />
                ))}
            {friends.map(friend => (
                <Friend key={friend.username} friend={friend} />
            ))}
            </>
    );
}

export default FriendList;