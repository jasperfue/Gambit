import React, {useCallback, useEffect, useState, useContext} from "react";
import Views from "./Views.js";
import Navbar from "./Components/Navbar.js";
import {Box, useColorMode} from "@chakra-ui/react";
import {SocketContext} from "./Context/SocketContext.js";
import {AccountContext} from "./Context/AccountContext.js";



function App() {
    const { colorMode } = useColorMode();
    const {socket} = useContext(SocketContext);
    const {user} = useContext(AccountContext);


    return (
            <Box bg={colorMode === "light" ? "gray.200" : "purple.900"} minH="100vh">
                <Navbar />
                <Views />
            </Box>
    );
}

export default App;
