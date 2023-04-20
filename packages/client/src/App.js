import React from "react";
import Views from "./Views.js";
import { ChakraBaseProvider, ColorModeScript} from "@chakra-ui/react";
import SocketConnectionContext from "./Context/SocketContext.js";
import UserContext from "./Context/AccountContext.js";
import customTheme from "./Theme/theme.js";
import {BrowserRouter} from "react-router-dom";



function App() {


    return (
        <BrowserRouter>
            <UserContext>
                <SocketConnectionContext>
                    <ChakraBaseProvider theme={customTheme}>
                        <ColorModeScript initialColorMode={customTheme.config.initialColorMode} />
                        <Views />
                    </ChakraBaseProvider>
                </SocketConnectionContext>
            </UserContext>
        </BrowserRouter>
    );
}

export default App;
