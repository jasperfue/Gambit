import React from "react";
import Login from "../components/Login.js";

const StartGame = (props) => {

    function onSubmit(time) {
        props.setIsWantingToPlay(true);
        props.setTime(time);
    }

    return (
        <div>
            <h1>Gambit</h1>
            <Login/>
            <p id="message"/>
            <form onSubmit={() => {
            }}>
                <input id="userName" type="text" onChange={e => props.setUserName(e.target.value)} placeholder="user name" />
                <button onClick={() => onSubmit({type: 'Bullet', minutes: 1, increment: 0, string: '1 + 0'})}>1 + 0</button>
                <button onClick={() => onSubmit({type: 'Bullet', minutes: 2, increment: 1, string: '2 + 1'})}>2 + 1</button>
                <button onClick={() => onSubmit({type: 'Blitz', minutes: 3, increment: 0, string: '3 + 0'})}>3 + 0</button>
                <button onClick={() => onSubmit({type: 'Blitz', minutes: 3, increment: 2, string: '3 + 2'})}>3 + 2</button>
                <button onClick={() => onSubmit({type: 'Blitz', minutes: 5, increment: 0, string: '5 + 0'})}>5 + 0</button>
                <button onClick={() => onSubmit({type: 'Blitz', minutes: 5, increment: 3, string: '5 + 3'})}>5 + 3</button>
                <button onClick={() => onSubmit({type: 'Rapid', minutes: 10, increment: 0, string: '10 + 0'})}>10 + 0</button>
                <button onClick={() => onSubmit({type: 'Rapid', minutes: 10, increment: 5, string: '10 + 5'})}>10 + 5</button>
                <button onClick={() => onSubmit({type: 'Rapid', minutes: 15, increment: 10, string: '15 + 10'})}>15 + 10</button>
                <button onClick={() => onSubmit({type: 'Classical', minutes: 30, increment: 0, string: '30 + 0'})}>30 + 0</button>
                <button onClick={() => onSubmit({type: 'Classical', minutes: 30, increment: 20, string: '30 + 20'})}>30 + 20</button>

            </form>
        </div>
    )
}

export default StartGame