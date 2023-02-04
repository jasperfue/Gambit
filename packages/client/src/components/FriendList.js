import React, {useEffect, useState} from 'react';
import socket from "../Socket.js";
import Friend from "./Friend.js";
import AddFriendModal from "./AddFriendModal.js";

const FriendList = (props) => {
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        if(socket.connected) {
            socket.on('friends', (friendList) => {
                props.setFriends(friendList);
            })
        } else {
            console.log('Socket nicht verbunden');
        }
    }, []);

    return (
        <>
            <AddFriendModal friends={friends} setFriends={setFriends}/>
            {friends.map(friend => (
                <Friend key={friend.username} name={friend.username} />
            ))}
            </>
    );
}

export default FriendList;