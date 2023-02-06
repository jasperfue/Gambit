import React, {useState} from 'react';
import socket from "../Socket.js";

const FriendRequest = (props) => {
    const [error, setError] = useState('');

    const acceptFriendRequest = () => {
        socket.emit('accept_friend_request', props.request, ({errMsg, done, newFriend}) => {
            if(done) {
                props.setFriendRequests(friendRequests =>
                    friendRequests.filter(request => request !== props.request)
                );
                props.setFriends(friends => [newFriend, ...friends]);
            } else {
                setError(errMsg);
            }
        });
    }

    const declineFriendRequest = () => {
        socket.emit('decline_friend_request', props.request, ({errMsg, done}) => {
            if(done) {
                props.setFriendRequests(friendRequests =>
                    friendRequests.filter(request => request !== props.request)
                );
            } else {
                setError(errMsg);
            }
        });
    }
    return (
        <>
            <p>{error}</p>
        <p>{props.request}</p>
            <button onClick={() => acceptFriendRequest()}>Accept</button>
            <button onClick={() => declineFriendRequest()}>Decline</button>
            </>
    )
}

export default FriendRequest;