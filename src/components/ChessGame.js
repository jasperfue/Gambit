import React, {useEffect, useState} from "react";
import {useParams, useNavigate} from 'react-router-dom'

const ChessGame = (props) => {
    const[userName, setUserName] = useState('');
    const[opponent, setOpponent] = useState('');
    const[clientSocket, setClientSocket] = useState(null);
    const[startGame, setStartGame] = useState(false);

    useEffect(() => {
        setUserName(props.userName);
        setOpponent(props.opponent);
        setClientSocket(props.socket);
    },[]);
    //const roomId = useParams();

    useEffect(() => {
        console.log(clientSocket + "    " + userName + "   " + opponent);
        if(clientSocket !== null && userName.length > 0 && opponent.length > 0) {
            setStartGame(true);
        }
    },[clientSocket, userName, opponent])


    return (
        <div>
        {startGame ?
            <>
                <h1>Hey {userName}</h1>
                <h1>Viel Glück gegen {opponent}</h1>
            </>
                :
                    <h1>Spiel wird gestartet!</h1>
        }
        </div>
    )
}

export default ChessGame