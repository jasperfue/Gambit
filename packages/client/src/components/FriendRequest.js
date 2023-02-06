import React, {useState} from 'react';
import socket from "../Socket.js";

const FriendRequest = (props) => {
    const [error, setError] = useState('');

    const acceptFriendRequest = () => {
        socket.emit('accept_friend_request', props.request.username, ({errMsg, done, newFriend}) => {
            if(done) {
                props.setFriendRequests(friendRequests =>
                    friendRequests.filter(request => request.username !== props.request.username)
                );
                props.setFriends(friends => [newFriend, ...friends]);
            } else {
                setError(errMsg);
            }
        });
    }

    const declineFriendRequest = () => {
        socket.emit('decline_friend_request', props.request.username, ({errMsg, done}) => {
            if(done) {
                props.setFriendRequests(friendRequests =>
                    friendRequests.filter(request => request.username !== props.request.username)
                );
            } else {
                setError(errMsg);
            }
        });
    }
    return (
        <>
            <p>{error}</p>
        <p>{props.request.username}</p>
            <button onClick={() => acceptFriendRequest()}>Accept</button>
            <button onClick={() => declineFriendRequest()}>Decline</button>
            </>
    )
}

export default FriendRequest;