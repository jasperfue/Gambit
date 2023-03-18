// components/Navbar.js
import React, { useContext } from "react";
import {
    Flex,
    Box,
    Spacer,
    Button,
    IconButton,
    Image,
    useColorMode,
    useColorModeValue,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Avatar,
    Text,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { AccountContext } from "../AccountContext.js";
import {useNavigate} from "react-router-dom";

const Navbar = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const buttonBackground = useColorModeValue("primary.500", "secondary.500");
    const textColor = useColorModeValue("black", "white");
    const { user, setUser } = useContext(AccountContext);
    const navigate = useNavigate();

    const loginPage = () => {
        navigate("/Login");
    }

    const signUpPage = () => {
        navigate("/SignUp");
    }

    return (
        <Flex
            as="nav"
            alignItems="center"
            padding="1.5rem"
            boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            backgroundColor={buttonBackground}
        >
            <Box>
                <Image src={colorMode === "light" ? "/GAMBIT_LIGHT.png" : "GAMBIT_DARK.png"} alt="Gambit Logo" height="60px" marginTop="-20px" marginBottom="-20px"/>
            </Box>
            <Spacer />
            <Box>
                <IconButton
                    aria-label="Toggle color mode"
                    backgroundColor="transparent"
                    icon={colorMode === "light" ? <MoonIcon color="tertiary.500"/> : <SunIcon color="primary.500"/>}
                    onClick={toggleColorMode}
                    marginRight="1rem"
                    color={textColor}
                    _hover={{
                        backgroundColor: colorMode === "light" ? "quaternary.500" : "tertiary.500"
                    }}
                />
                <Button
                    onClick={signUpPage}
                    backgroundColor={colorMode === 'light' ? 'tertiary.500' : 'primary.500'}
                    color={colorMode === 'light' ? "primary.500" : "secondary.500"}
                    borderWidth="1px"
                    borderColor={colorMode === "light" ? "tertiary.500" : "primary.500"}
                    marginRight="1rem"
                    _hover={{
                        backgroundColor: "transparent",
                        color: colorMode === 'light' ? "tertiary.500" : "primary.500",
                    }}
                >
                    Sign Up
                </Button>


                <Button
                    onClick={loginPage}
                    backgroundColor="transparent"
                    color={colorMode === 'light' ? "tertiary.500" : "primary.500"}
                    borderWidth="1px"
                    borderColor={colorMode === "light" ? "tertiary.500" : "primary.500"}
                    marginRight="1rem"
                    _hover={{
                        backgroundColor: colorMode === "light" ? "tertiary.500": "primary.500",
                        color: colorMode === 'light' ? "primary.500" : "secondary.500",
                    }}
                >
                    Log In
                </Button>
                {user.loggedIn ?
                <>
                    <Menu>
                        <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            variant="outline"
                            borderColor={textColor}
                            color={textColor}
                            ml={4}
                        >
                            <Avatar size="xs" mr={2} />
                            <Text>{}</Text>
                        </MenuButton>
                        <MenuList>
                            <MenuItem>Profile Information</MenuItem>
                            <MenuItem>Friends</MenuItem>
                        </MenuList>
                    </Menu>
                </>
                :
                <>
                </>
                }
            </Box>
        </Flex>
    );
};

export default Navbar;
