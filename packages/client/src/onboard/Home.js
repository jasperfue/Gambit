import React, {useContext, useEffect, useState} from "react";
import Login from "../components/Login.js";
import {AccountContext} from "../AccountContext.js";
import { useNavigate } from "react-router-dom";
import GameLobby from "../components/GameLobby.js";

const Home = () => {
    const {user} = useContext(AccountContext);
    const [time, setTime] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log('home');
    }, [])
    const loginPage = () => {
        navigate("/Login");
    }

    const signUpPage = () => {
        navigate("/SignUp");
    }

    function onSubmit(time) {
        setTime(time);
    }

    return (
        <>
            {time === null ?
                <> </>
                :
                <GameLobby time={time}/>
            }
            <h1>Gambit</h1>
            {user.loggedIn === true ?
                <h3> Hey {user.username},</h3>
                :
                <>
                    <button onClick={loginPage}>Login</button>
                    <button onClick={signUpPage}>Sign Up</button>
                </>
            }
            <form onSubmit={() => {
            }}>
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
        </>
    )
}

export default Home;