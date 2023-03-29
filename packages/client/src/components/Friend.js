import React, {useEffect, useState} from 'react';
import {
    HStack,
    Box,
    Text,
    useColorModeValue,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
} from '@chakra-ui/react';
import { useNavigate } from "react-router";
import {ViewIcon} from "@chakra-ui/icons";

const Friend = (props) => {
    const green = useColorModeValue('green.500', 'green.400');
    const red = useColorModeValue('red.500', 'red.400');
    const navigate = useNavigate();
    const [activeGames, setActiveGames] = useState(props.friend.activeGames);
    const menuList = useColorModeValue("white", "purple.900");
    const hover = useColorModeValue("gray.200", "purple.600");

    const handleGameClick = (game) => {
        navigate(`/game/${game}`);
    };

    return (
        <HStack spacing={3}>
            <Box
                backgroundColor={props.friend.connected === 'true' ? green : red}
                borderRadius="50%"
                width="20px"
                height="20px"
            />
            <Text>{props.friend.username}</Text>
            {activeGames && activeGames.length > 0 && (
                <Box>
                <Menu>
                    <MenuButton
                        as={IconButton}
                        icon={<ViewIcon />}
                        backgroundColor="transparent"
                        aria-label="View active games"
                        marginLeft={10}
                        _hover={{
                            backgroundColor: hover
                        }}
                    />
                    <MenuList backgroundColor={menuList} p={1} borderRadius="md">
                        {/* Map through the activeGames list and create menu items */}
                        {activeGames.map((game, index) => (
                            <MenuItem key={index} onClick={() => handleGameClick(game)} backgroundColor={menuList}
                            _hover={{

                                backgroundColor: hover
                            }}>
                                {game}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
                </Box>
            )}

        </HStack>
    );
};

export default Friend;
