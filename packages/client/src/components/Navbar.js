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
    HStack,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { AccountContext } from "../AccountContext.js";
import {useNavigate} from "react-router-dom";
import socket from "../Socket.js";
const Navbar = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const textColor = useColorModeValue("black", "white");
    const { user, setUser } = useContext(AccountContext);
    const navigate = useNavigate();
    const contrast = useColorModeValue("purple.500", "white");
    const bg = useColorModeValue("white", "purple.500");
    const hover = useColorModeValue("purple.200", "purple.600");
    const primaryButton = useColorModeValue("primary-light", "primary-dark");
    const secondaryButton = useColorModeValue("secondary-light", "secondary-dark");
    const loginPage = () => {
        navigate("/Login");
    }

    const signUpPage = () => {
        navigate("/SignUp");
    }

    const homePage = () => {
        navigate("/");
    }

    const friendsPage = () => {
        console.log("Friends");
    }

    const logOut = () => {
        socket.emit('logout' ,({done}) => {
            if(done) {
                setUser({loggedIn: false});
            } else {
                console.log('logging out failed');
            }
        });
    }

    return (
        <Flex
            as="nav"
            alignItems="center"
            padding="1rem"
            boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            backgroundColor={bg}
            position="sticky"
            top={0}
        >
            <Box onClick={homePage} cursor="pointer">
                <Image src={colorMode === "light" ? "/Gambit light.png" : "/Gambit dark.png"} alt="Gambit Logo" height="100px" marginTop="-50px" marginBottom="-50px"/>
            </Box>
            <Spacer />
            <Box>
                <IconButton
                    aria-label="Toggle color mode"
                    backgroundColor="transparent"
                    icon={colorMode === "light" ? <MoonIcon color="purple.500"/> : <SunIcon color="white"/>}
                    onClick={toggleColorMode}
                    marginRight="1rem"
                    color={textColor}
                    _hover={{
                        backgroundColor: hover
                    }}
                />
                {user.loggedIn ?
                    <>
                        <Menu>
                            <MenuButton
                                as={Button}
                                rightIcon={<ChevronDownIcon />}
                                variant="outline"
                                borderColor={contrast}
                                color={contrast}
                                ml={4}
                                marginRight="1rem"
                                _hover={{
                                    backgroundColor: hover
                                }}
                                _active={{
                                    backgroundColor: hover
                                }}
                            >
                                <HStack spacing={2}>
                                    <Avatar size="xs" />
                                    <Text>{user.username}</Text>
                                </HStack>
                            </MenuButton>
                            <MenuList
                            background={bg}
                            color={contrast}
                            >
                                <MenuItem
                                background={bg}
                                _hover={{
                                    backgroundColor: hover
                                }}
                                >
                                    Profile Information (In Development)
                                </MenuItem>
                            </MenuList>
                        </Menu>
                        <Button
                            onClick={logOut}
                             variant={primaryButton}
                        >
                            Log Out
                        </Button>
                    </>
                :
                    <>
                        <Button
                            onClick={signUpPage}
                            variant={primaryButton}
                        >
                            Sign Up
                        </Button>


                        <Button
                            onClick={loginPage}
                            variant={secondaryButton}
                        >
                            Log In
                        </Button>
                    </>
                }
            </Box>
        </Flex>
    );
};

export default Navbar;
