import React from 'react';
const Friend = (props) => {

    return (
        <div>
            {props.friend.connected === "true" ?
                <div style={{
                    backgroundColor: "green",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px"
                }} />
                :
                <div style={{
                    backgroundColor: "red",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px"
                }} />
            }

            <p>{props.friend.username}</p>
        </div>
    )
}

export default Friend;