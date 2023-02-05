import React from 'react';

const FriendRequest = (props) => {
    return (
        <>
        <p>{props.request.username}</p>
            <button>Accept</button>
            <button>Decline</button>
            </>
    )
}

export default FriendRequest;