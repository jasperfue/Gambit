import React, { useState, useContext } from 'react';
import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    FormControl,
    FormLabel,
    Input,
    useDisclosure,
    Text,
    useColorModeValue, useColorMode
} from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import {SocketContext} from "../App.js";

const AddFriendModal = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const button = useColorModeValue("start-game-light", "start-game-dark");
    const green = useColorModeValue("green.500", "green.400");
    const red = useColorModeValue("red.500", "red.400");
    const { colorMode } = useColorMode();
    const primaryButton = useColorModeValue("primary-light", "primary-dark");
    const {socket} = useContext(SocketContext);

    return (
        <>
            <Button onClick={onOpen} variant={button}>Add a Friend</Button>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent backgroundColor={colorMode === "light" ? "white" : "purple.500"}>
                    <ModalHeader>Add a friend</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Formik
                            initialValues={{ username: '' }}
                            onSubmit={(values) => {
                                setError('');
                                setSuccess('');
                                socket.emit('send_friend_request', values.username, ({ errorMsg, done }) => {
                                    if (done) {
                                        setSuccess('Friend request sent!');
                                    } else {
                                        setError(errorMsg);
                                    }
                                });
                            }}
                        >
                            {({ handleSubmit, handleChange, values }) => (
                                <Form onSubmit={handleSubmit}>
                                    <FormControl>
                                        <FormLabel>Enter username</FormLabel>
                                        <Field as={Input} type="text" name="username" placeholder="Enter username" onChange={handleChange} />
                                    </FormControl>
                                    <Text marginTop={2} color={red}>{error}</Text>
                                    <Text marginTop={2} color={green}>{success}</Text>
                                    <Button mt={4} type="submit" isDisabled={!values.username} variant={primaryButton}>
                                        Submit
                                    </Button>

                                </Form>
                            )}
                        </Formik>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

export default AddFriendModal;
