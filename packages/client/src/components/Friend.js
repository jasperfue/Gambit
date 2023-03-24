import React from 'react';
import { HStack, Box, Text, useColorModeValue } from '@chakra-ui/react';
const Friend = (props) => {
    const green = useColorModeValue("green.500", "green.400");
    const red = useColorModeValue("red.500", "red.400");

    return (
        <HStack spacing={3}>
            <Box
                backgroundColor={props.friend.connected === "true" ? green : red}
                borderRadius="50%"
                width="20px"
                height="20px"
            />
            <Text>{props.friend.username}</Text>
        </HStack>
    );
}

export default Friend;