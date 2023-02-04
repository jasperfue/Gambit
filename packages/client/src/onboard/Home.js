import React, {useContext, useEffect, useState} from "react";
import {AccountContext} from "../AccountContext.js";
import { useNavigate } from "react-router-dom";
import socket from "../Socket.js";
import FriendList from "../components/FriendList.js";

const Home = () => {
    const {user} = useContext(AccountContext);
    const [time, setTime] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log('home');
        socket.connect();
        socket.on('connect_error', (err => {
            console.log('err');
            console.log(err);
        }));
        return () => {
            socket.off('connect_error');
            socket.off('connect');
        }
    }, []);

    useEffect(() => {
        if(time !== null) {
            console.log('nur ein mal');
            socket.emit('find_game', user, time);
            socket.on('joinedGame', (opponent, roomId, playerColour) => {
                console.log("Partie gefunden: " + roomId + " gegner: " + opponent);
                navigate(`game/${roomId}`, {
                    state: {
                        player1: user,
                        opponent: opponent,
                        playerColourIsWhite: playerColour,
                        time: time
                    }
                });
            });
            return () => {
                socket.off('joinedGame');
            }
        }
    }, [time]);

    const loginPage = () => {
        navigate("/Login");
    }

    const signUpPage = () => {
        navigate("/SignUp");
    }

    const cancelGame = () => {
        socket.emit('leave_queue');
        setTime(null);
    }

    return (
        <>
            {time === null ?
                <>
                    <h1>Gambit</h1>
                    {user.loggedIn === true ?
                        <>
                        <h3> Hey {user.username},</h3>
                        <FriendList/>
                        </>
                        :
                        <>
                            <button onClick={loginPage}>Login</button>
                            <button onClick={signUpPage}>Sign Up</button>
                        </>
                    }
                    <form onSubmit={() => {
                    }}>
                        <button onClick={() => setTime({type: 'Bullet', minutes: 1, increment: 0, string: '1 + 0'})}>1 + 0</button>
                        <button onClick={() => setTime({type: 'Bullet', minutes: 2, increment: 1, string: '2 + 1'})}>2 + 1</button>
                        <button onClick={() => setTime({type: 'Blitz', minutes: 3, increment: 0, string: '3 + 0'})}>3 + 0</button>
                        <button onClick={() => setTime({type: 'Blitz', minutes: 3, increment: 2, string: '3 + 2'})}>3 + 2</button>
                        <button onClick={() => setTime({type: 'Blitz', minutes: 5, increment: 0, string: '5 + 0'})}>5 + 0</button>
                        <button onClick={() => setTime({type: 'Blitz', minutes: 5, increment: 3, string: '5 + 3'})}>5 + 3</button>
                        <button onClick={() => setTime({type: 'Rapid', minutes: 10, increment: 0, string: '10 + 0'})}>10 + 0</button>
                        <button onClick={() => setTime({type: 'Rapid', minutes: 10, increment: 5, string: '10 + 5'})}>10 + 5</button>
                        <button onClick={() => setTime({type: 'Rapid', minutes: 15, increment: 10, string: '15 + 10'})}>15 + 10</button>
                        <button onClick={() => setTime({type: 'Classical', minutes: 30, increment: 0, string: '30 + 0'})}>30 + 0</button>
                        <button onClick={() => setTime({type: 'Classical', minutes: 30, increment: 20, string: '30 + 20'})}>30 + 20</button>
                    </form>
                </>
                :
                <>
                    <p>Waiting for opponent...</p>
                    <button onClick={cancelGame}>Cancel</button>
                </>
            }
        </>
    )
}

export default Home;