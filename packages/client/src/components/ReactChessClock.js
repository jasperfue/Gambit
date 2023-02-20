import React, {useEffect, useRef, useState} from "react";
const ReactChessClock = (props) => {
    const [time, setTime] = useState(props.time);
    const [timeWhite, setTimeWhite] = useState(props.remainingTimeWhite
        ? props.remainingTimeWhite.minutes * 60 + props.remainingTimeWhite.seconds
        : time.minutes * 60);
    const [timeBlack, setTimeBlack] = useState(props.remainingTimeBlack
    ? props.remainingTimeBlack.minutes * 60 + props.remainingTimeBlack.seconds
: time.minutes * 60);
    const [orientation, setOrientation] = useState(props.orientation);
    const [socket, setSocket] = useState(props.socket);
    const currentTimer = useRef(0);
    const [currentTurn,setCurrentTurn] = useState(props.currentState);
    const [startingTimeWhite, setStartingTimeWhite] = useState(props.startingTimeWhite);
    const [startingTimeBlack, setStartingTimeBlack] = useState(props.startingTimeBlack);

    const decrease = (setFunction) => {
        setFunction(seconds => {
            if(seconds === 0) {
                setCurrentTurn('off');
            } else {
                return seconds - 1;
            }
        });
    }

    useEffect(() => {
        console.log('toggle');
        let setFunction = () => {};
        switch (currentTurn) {
            case 'tw':
                setFunction = setTimeWhite;
                console.log('tw');
                break;
            case 'tb':
                setFunction = setTimeBlack;
                break;
            case 'sw':
                setFunction = setStartingTimeWhite;
                break;
            case 'sb':
                setFunction = setStartingTimeBlack;
                break;
            default:
                console.log(currentTurn);
                return;
        }
        const id = setInterval(() => {
            if(currentTurn === 'off') {
                clearInterval(id);
                return;
            }
            decrease(setFunction);
        }, 1000);
        currentTimer.current = id;
        return () => {
            clearInterval(id);
        }
    }, [currentTurn]);

    useEffect(() => {
        socket.on('updatedTime', (timeWhite, timeBlack, turn) => {
            console.log('updatedTime');
            stopClocks();
            updateTime(timeWhite, timeBlack);
            setCurrentTurn(turn);
        });
        socket.on('stop_starting_time_white', () => {
            stopClocks();
            setCurrentTurn('sb');
        });
        socket.on('stop_starting_time_black', ()  => {
            stopClocks();
            setCurrentTurn('tw');
        })
        return () => {
            socket.off('updatedTime');
            socket.off('startClock');
            socket.off('start_starting_Time_White');
            socket.off('start_starting_Time_Black');

        }
    }, [socket]);


    function stopClocks() {
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
                {currentTurn.includes('s')
                ?
                    <p>{startingTimeBlack}</p>
                :
                <> </>}
                <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                    <p id={'Black'}>{(timeBlack / 60 > 9 ? Math.trunc(timeBlack / 60) : '0' + Math.trunc(timeBlack / 60)) + ":" +
                    (timeBlack % 60 > 9 ? timeBlack % 60 : '0' + timeBlack % 60)}</p>
                </div>
                <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                <p id={'White'}>{(timeWhite / 60 > 9 ? Math.trunc(timeWhite / 60) : '0' + Math.trunc(timeWhite / 60)) + ":" +
                (timeWhite % 60 > 9 ? timeWhite % 60 : '0' + timeWhite % 60)}</p>
            </div>
                {currentTurn === "sw"
                ?
                <p>{startingTimeWhite}</p>
                :
                <> </>}
            </>
            :
                <>
                    {currentTurn === "sw"
                    ?
                    <p>{startingTimeWhite}</p>
                    :
                    <> </>}
                    <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                        <p id={'White'}>{(timeWhite / 60 > 9 ? Math.trunc(timeWhite / 60) : '0' + Math.trunc(timeWhite / 60)) + ":" +
                        (timeWhite % 60 > 9 ? timeWhite % 60 : '0' + timeWhite % 60)}</p>
                    </div>
                    <div style={{display: "flex", flexDirection: "row", backgroundColor: 'whitesmoke', marginTop:'1VH', padding:25}}>
                        <p id={'Black'}>{(timeBlack / 60 > 9 ? Math.trunc(timeBlack / 60) : '0' + Math.trunc(timeBlack / 60)) + ":" +
                        (timeBlack % 60 > 9 ? timeBlack % 60 : '0' + timeBlack % 60)}</p>
                    </div>
                    {currentTurn.includes("s")
                        ?
                        <p>{startingTimeBlack}</p>
                        :
                        <> </>}
                    </>
        }
        </>
    )

}
export default ReactChessClock;