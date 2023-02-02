import {AccountContext} from "./AccountContext.js";
import {Route, Routes} from "react-router-dom";
import React, {useContext} from "react";
import Home from "./onboard/Home.js"
import Login from "./components/Login.js";
import ChessGame from "./components/ChessGame.js";

const Views = () => {
    const {user} = useContext(AccountContext);

    return user.loggedIn === null ?
        <h1>Loading...</h1>
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