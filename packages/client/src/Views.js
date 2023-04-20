import {AccountContext} from "./Context/AccountContext.js";
import {Route, Routes} from "react-router-dom";
import React, {useContext} from "react";
import Home from "./Views/Home.js"
import Login from "./Views/Login.js";
import SignUp from "./Views/SignUp.js";
import ChessGame from "./Views/ChessGame.js";
import {
    Spinner,
    Flex,
    Heading
} from '@chakra-ui/react'
import {SocketContext} from "./Context/SocketContext.js";
import GameRequests from "./Components/GameRequests.js";

const Views = () => {
    const {user} = useContext(AccountContext);
    const {socket} = useContext(SocketContext);


    return user.loggedIn === null || socket === null ?
        <Flex align="center" justify="center" direction="column" height="80 vh">
            <Heading as='h2' size='lg'>Loading...</Heading>
            <Spinner size='xl' color="purple.500" marginTop="4" />
        </Flex>

        :
        <>
        <GameRequests />
            <Routes>
                <Route path="/" element={<Home/>} />
                <Route path="/game/:roomId" element={<ChessGame/>} />
                <Route path="/Login" element={<Login />} />
                <Route path="/SignUp" element={<SignUp  />} />
                <Route path="*" element={<Home/>} />
            </Routes>
            </>
}

export default Views;