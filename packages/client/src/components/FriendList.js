import React, {useEffect, useState} from 'react';
import socket from "../Socket.js";
import Friend from "./Friend.js";
import FriendRequest from "./FriendRequest.js";
import AddFriendModal from "./AddFriendModal.js";

const FriendList = () => {
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentFriendRequests, setSentFriendRequests] = useState([]);

    useEffect(() => {
        socket.connect();
        socket.on('connect', () => {
            socket.on('friends', (friendList) => {
                setFriends(friendList);
            });
            socket.on('friend_requests', (friendRequests) => {
               setFriendRequests(friendRequests);
               console.log(friendRequests);
            });
            socket.on('connected', (status, username) => {
                setFriends(prevFriends => {
                    return [...prevFriends].map(friend => {
                        if(friend.username === username) {
                            friend.connected = status;
                        }
                        return friend;
                    })
                })
            })
        });
        return () => {
            socket.off('connect');
            socket.off('friends');
            socket.off('connected');
        }
    }, []);

    return (
        <>
            <AddFriendModal setSentFriendRequests={setSentFriendRequests}/>
            {friendRequests.map(request => (
                <FriendRequest key={request.username} request={request} />
                ))}
            {friends.map(friend => (
                <Friend key={friend.username} friend={friend} />
            ))}
            </>
    );
}

export default FriendList;