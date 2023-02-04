import React, {useEffect, useState} from 'react';
import socket from "../Socket.js";
import Friend from "./Friend.js";
import AddFriendModal from "./AddFriendModal.js";

const FriendList = () => {
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        socket.connect();
        socket.on('connect', () => {
            socket.on('friends', (friendList) => {
                setFriends(friendList);
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
        }
    }, []);

    return (
        <>
            <AddFriendModal setFriends={setFriends}/>
            {friends.map(friend => (
                <Friend key={friend.username} friend={friend} />
            ))}
            </>
    );
}

export default FriendList;