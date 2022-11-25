import React, {useState} from "react";

const StartGame = (props) => {



    return (
        <div>
            <h1>Messages</h1>
            <p id="message"/>
            <form onSubmit={() => {
                props.setIsWantingToPlay(true);
            }}>
                <input id="userName" type="text" onChange={e => props.setUserName(e.target.value)} placeholder="user name" />
                <input type="submit" value="Connect" />
            </form>
        </div>
    )
}

export default StartGame