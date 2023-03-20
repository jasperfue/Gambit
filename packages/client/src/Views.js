import {AccountContext} from "./AccountContext.js";
import {Route, Routes} from "react-router-dom";
import React, {useContext} from "react";
import Home from "./onboard/Home.js"
import Login from "./components/Login.js";
import ChessGame from "./components/ChessGame.js";
import { Spinner, Flex, Heading } from '@chakra-ui/react'

const Views = () => {
    const {user} = useContext(AccountContext);

    return user.loggedIn === null ?
        <Flex align="center" justify="center" direction="column" height="80 vh">
            <Heading as='h2' size='lg'>Loading...</Heading>
            <Spinner size='xl' color="purple.500" marginTop="4" />
        </Flex>

        :
            <Routes>
                <Route path="/" element={<Home/>} />
                <Route path="/game/:roomId" element={<ChessGame/>} />
                <Route path="/Login" element={<Login mode="login" />} />
                <Route path="/SignUp" element={<Login mode="signUp" />} />
                <Route path="*" element={<Home/>} />
            </Routes>
}

export default Views;