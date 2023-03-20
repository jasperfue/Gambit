import React, {useEffect} from "react";
import UserContext from "./AccountContext.js";
import Views from "./Views.js";
import Navbar from "./components/Navbar.js";
import {Box, useColorMode} from "@chakra-ui/react";

function App() {


    const { colorMode } = useColorMode();

useEffect(() => {
    console.log('App');
}, []);
  return (
          <UserContext>
              <Box bg={colorMode === "light" ? "gray.200" : "purple.900"} minH="100vh">
              <Navbar />
              <Views />
              </Box>
          </UserContext>
  );
}

export default App;
