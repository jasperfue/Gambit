import React, {useEffect, useRef, useState} from "react";
import {ChessClock} from "../Chess/ChessClock.js"
import {toColor} from "../Chess/ChessLogic.js";
import {Chess} from "chess.js";
const ReactChessClock = (props) => {
    const [time, setTime] = useState(props.time);
    const [remainingTimeWhite, setRemainingTimeWhite] = useState({minutes: time.minutes, seconds: 0, colour: 'white'});
    const [remainingTimeBlack, setRemainingTimeBlack] = useState({minutes: time.minutes, seconds: 0, colour: 'black'});
    const [orientation, setOrientation] = useState(props.colour);
    const [socket, setSocket] = useState(props.socket);
    const [remainingTimeBlackString, setRemainingTimeBlackString] = useState((remainingTimeBlack.minutes > 9 ? remainingTimeBlack.minutes : '0' + remainingTimeBlack.minutes) + ":" +
        (remainingTimeBlack.seconds > 9 ? remainingTimeBlack.seconds : '0' + remainingTimeBlack.seconds));
    const [remainingTimeWhiteString, setRemainingTimeWhiteString] = useState((remainingTimeWhite.minutes > 9 ? remainingTimeWhite.minutes : '0' + remainingTimeWhite.minutes) + ":" +
        (remainingTimeWhite.seconds > 9 ? remainingTimeWhite.seconds : '0' + remainingTimeWhite.seconds));
    const [currentTimer, setCurrentTimer] = useState(0);
    const [currentTurn,setCurrentTurn] = useState('');

    const decrease = (remainingTime) => {
        if(remainingTime.seconds === 0) {
            if(remainingTime.minutes === 0) {
                //TODO: GAME LOST
                setCurrentTurn('stop');
                console.log('LOST');
                return;
            } else {
                console.log(remainingTime);
                return {minutes: remainingTime.minutes - 1, seconds: 59};
            }
        } else {
            console.log(remainingTime);
            return {...remainingTime, seconds: remainingTime.seconds - 1};
        }
    }

    useEffect(() => {
        console.log(currentTurn);
        const id = setInterval(() => {
            if(currentTurn === 'white') {
                console.log('???');
                const newRemainingTime = decrease(remainingTimeWhite);
                setRemainingTimeWhite(newRemainingTime);
            } else if(currentTurn === 'black') {
                const newRemainingTime = decrease(remainingTimeBlack);
                setRemainingTimeBlack(newRemainingTime);
            } else if(currentTurn === 'stop') {
                clearInterval(id);
            }
        }, 1000);
        console.log(id);
        setCurrentTimer(id);
    }, [currentTurn]);

    useEffect(() => {
        socket.on('updatedTime', (timeWhite, timeBlack, turn) => {
            console.log('updatedTime')
            stopClocks();
            updateTime(timeWhite, timeBlack);
            setCurrentTurn(turn);
        });
        socket.on('opponentMove', (move, number) => {
            console.log(move, number);
            if (move.color == 'b' && number == 2) {
                setCurrentTurn('white');
            }
        })
    }, []);

    function remainingTimeToString(remainingTime) {
        console.log((remainingTime.minutes > 9 ? remainingTime.minutes : '0' + remainingTime.minutes) + ":" +
            (remainingTime.seconds > 9 ? remainingTime.seconds : '0' + remainingTime.seconds));
        return (remainingTime.minutes > 9 ? remainingTime.minutes : '0' + remainingTime.minutes) + ":" +
            (remainingTime.seconds > 9 ? remainingTime.seconds : '0' + remainingTime.seconds);
    }
    function start(colour) {
        const id = setInterval(() => {
            if(colour == 'white') {
                setRemainingTimeWhite(decrease(remainingTimeWhite));
                setRemainingTimeWhiteString(remainingTimeToString(decrease(remainingTimeWhite)));
            } else {
                setRemainingTimeBlack(decrease(remainingTimeBlack));
                setRemainingTimeBlackString(remainingTimeToString(decrease(remainingTimeBlack)));
            }
        }, 1000);
    }

    function stopClocks() {
        if(currentTimer !== 0) {
            clearInterval(currentTimer);
        }
    }

    function updateTime(timeWhite, timeBlack) {
        setRemainingTimeBlack(timeBlack);
        setRemainingTimeWhite(timeWhite);
    }


    return (
        <>
        {orientation == 'white' ?
            <>
                <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                    <p id={'Black'}>{remainingTimeBlackString}</p>
                </div>
                <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                <p id={'White'}>{remainingTimeWhiteString}</p>
            </div>
            </>
            :
                <>
                    <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                        <p id={'White'}>{remainingTimeWhiteString}</p>
                    </div>
                    <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                        <p id={'Black'}>{remainingTimeBlackString}</p>
                    </div>
                    </>
        }
        </>
    )

}
export default ReactChessClock;