import React, {useEffect, useRef, useState} from "react";
import {ChessClock} from "../Chess/ChessClock.js"
import {toColor} from "../Chess/ChessLogic.js";
import {Chess} from "chess.js";
const ReactChessClock = (props) => {
    const [time, setTime] = useState(props.time);
    const [timeWhite, setTimeWhite] = useState(time.minutes * 60);
    const [timeBlack, setTimeBlack] = useState(time.minutes * 60);
    const [orientation, setOrientation] = useState(props.orientation);
    const [socket, setSocket] = useState(props.socket);
    const currentTimer = useRef(0);
    const [currentTurn,setCurrentTurn] = useState('');


    const decrease = (turn) => {
        if(turn === 'white') {
            setTimeWhite(seconds => {
                if(seconds === 0) {
                   console.log('LOST');
                   setCurrentTurn('stop');
                } else {
                    return seconds - 1;
                }
            });
        } else if(turn === 'black') {
            setTimeBlack(seconds => {
                if (seconds === 0) {
                    console.log('LOST');
                    setCurrentTurn('stop');
                } else {
                    return seconds - 1;
                }
            });
        }
    }

    useEffect(() => {
        console.log(currentTurn);
        const id = setInterval(() => {
            if(currentTurn === 'stop') {
                clearInterval(id);
                return;
            }
            decrease(currentTurn);
        }, 1000);
        currentTimer.current = id;
        console.log(id);
    }, [currentTurn]);

    useEffect(() => {
        socket.on('updatedTime', (timeWhite, timeBlack, turn) => {
            console.log('updatedTime');
            stopClocks();
            updateTime(timeWhite, timeBlack);
            setCurrentTurn(turn);
        });
        socket.on('startClock', () => {
            setCurrentTurn('white');
        });
        return () => {
            socket.off('updatedTime');
            socket.off('opponentMove');
            socket.off('startClock');
        }
    }, [socket]);


    function stopClocks() {
        console.log('stop: ' + currentTimer.current);
        if(currentTimer.current !== 0) {
            clearInterval(currentTimer.current);
            currentTimer.current = 0;
        }
    }

    function updateTime(timeWhite, timeBlack) {
        setTimeWhite(timeWhite.minutes * 60 + timeWhite.seconds);
        setTimeBlack(timeBlack.minutes * 60 + timeBlack.seconds);
    }


    return (
        <>
        {orientation === 'white' ?
            <>
                <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                    <p id={'Black'}>{(timeBlack / 60 > 9 ? Math.trunc(timeBlack / 60) : '0' + Math.trunc(timeBlack / 60)) + ":" +
                    (timeBlack % 60 > 9 ? timeBlack % 60 : '0' + timeBlack % 60)}</p>
                </div>
                <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                <p id={'White'}>{(timeWhite / 60 > 9 ? Math.trunc(timeWhite / 60) : '0' + Math.trunc(timeWhite / 60)) + ":" +
                (timeWhite % 60 > 9 ? timeWhite % 60 : '0' + timeWhite % 60)}</p>
            </div>
            </>
            :
                <>
                    <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                        <p id={'White'}>{(timeWhite / 60 > 9 ? Math.trunc(timeWhite / 60) : '0' + Math.trunc(timeWhite / 60)) + ":" +
                        (timeWhite % 60 > 9 ? timeWhite % 60 : '0' + timeWhite % 60)}</p>
                    </div>
                    <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                        <p id={'Black'}>{(timeBlack / 60 > 9 ? Math.trunc(timeBlack / 60) : '0' + Math.trunc(timeBlack / 60)) + ":" +
                        (timeBlack % 60 > 9 ? timeBlack % 60 : '0' + timeBlack % 60)}</p>
                    </div>
                    </>
        }
        </>
    )

}
export default ReactChessClock;