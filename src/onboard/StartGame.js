import React, {useState} from "react";

const StartGame = (props) => {

    function onSubmit(time) {
        props.setIsWantingToPlay(true);
        props.setTime(time);
    }

    return (
        <div>
            <h1>Messages</h1>
            <p id="message"/>
            <form onSubmit={() => {
            }}>
                <input id="userName" type="text" onChange={e => props.setUserName(e.target.value)} placeholder="user name" />
                <input value="1 + 0" onClick={() => onSubmit({type: 'Bullet', minutes: 1, increment: 0})} />
                <input value="2 + 1" onClick={() => onSubmit({type: 'Bullet', minutes: 2, increment: 1})} />
                <input value="3 + 0" onClick={() => onSubmit({type: 'Blitz', minutes: 3, increment: 0})} />
                <input value="3 + 2" onClick={() => onSubmit({type: 'Blitz', minutes: 3, increment: 2})} />
                <input value="5 + 0" onClick={() => onSubmit({type: 'Blitz', minutes: 5, increment: 0})} />
                <input value="5 + 3" onClick={() => onSubmit({type: 'Blitz', minutes: 5, increment: 3})} />
                <input value="10 + 0" onClick={() => onSubmit({type: 'Rapid', minutes: 10, increment: 0})} />
                <input value="10 + 5" onClick={() => onSubmit({type: 'Rapid', minutes: 10, increment: 5})} />
                <input value="15 + 10" onClick={() => onSubmit({type: 'Rapid', minutes: 15, increment: 10})} />
                <input value="30 + 0" onClick={() => onSubmit({type: 'Classical', minutes: 30, increment: 0})} />
                <input value="30 + 20" onClick={() => onSubmit({type: 'Classical', minutes: 30, increment: 20})} />

            </form>
        </div>
    )
}

export default StartGame