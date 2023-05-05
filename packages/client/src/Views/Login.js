import React, {useState, useContext, useEffect, useCallback} from "react";
import {Formik, Form, Field} from 'formik';
import {AccountContext} from "../Context/AccountContext.js";
import {LoginSchema, SignUpSchema} from "@gambit/common"
import {useNavigate} from 'react-router-dom';
import {
    Button,
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    VStack,
    Text,
    Link,
    Flex,
    Box,
    InputGroup,
    InputRightElement,
    IconButton,
    useColorModeValue, useColorMode,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

const Login = () => {
    const {setUser} = useContext(AccountContext);
    const [loginError, setLoginError] = useState(null);
    const navigate = useNavigate();
    const contrast = useColorModeValue("purple.500", "white");
    const equity = useColorModeValue("white", "purple.500");
    const bg = useColorModeValue("white", "purple.500");
    const red = useColorModeValue("red.500", "red.300");
    const hover = useColorModeValue("purple.200", "purple.700");
    const [showPassword, setShowPassword] = useState(false);


    const handlePasswordClick = useCallback(() => setShowPassword(!showPassword), [setShowPassword, showPassword]);


    const handleModeChange = useCallback((newMode) => {
        navigate(newMode);
    }, [navigate]);


    /**
     * Submit the form and send it to the server. Set either the user data or an error message based on the response.
     * @type {function({username, password}, function(boolean): void): void}
     */
    const submitLogin = useCallback((values, setSubmitting) => {
        fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values)
        })
            .catch(err => {
                setLoginError("Please try again later");
                setSubmitting(false);
                return;
            })
            .then(res => {
                if (!res || !res.ok || res.status >= 400) {
                    setSubmitting(false);
                    setLoginError("Please try again later");
                    return;
                }
                return res.json();
            })
            .then(data => {
                if (!data.loggedIn) {
                    setLoginError(data.message);
                    setSubmitting(false);
                    return;
                }
                setUser({...data});
                setLoginError(null);
                navigate('/');
            });
    }, [setLoginError, setUser, navigate]);

    return (
            <Flex width="100vw" height="70vh" alignItems="center" justifyContent="center" paddingTop="10vh" color={contrast}>
                <Box backgroundColor={bg} borderRadius="md" p={6} width="600px" boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)">
        <VStack spacing={4}>
                <Formik
                    initialValues={{
                        username: "",
                        password: "",
                    }}
                    validationSchema={LoginSchema}
                    validateOnChange={true}
                    onSubmit={(values, { setSubmitting }) => {
                        submitLogin(values, setSubmitting);
                    }}
                >
                    {({ isValid, isSubmitting }) => (
                        <Form style={{ width: "100%" }}>
                            <Field name="username">
                                {({ field, form }) => (
                                    <FormControl
                                        isInvalid={form.errors.username && form.touched.username}
                                    >
                                        <FormLabel htmlFor="username">Username</FormLabel>
                                        <Input {...field} id="username" focusBorderColor={contrast} autoComplete="username"/>
                                        <FormErrorMessage>{form.errors.username}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="password">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.password && form.touched.password}>
                                        <FormLabel htmlFor="password">Password</FormLabel>
                                        <InputGroup>
                                            <Input {...field} id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" />
                                            <InputRightElement>
                                                <IconButton
                                                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                                    onClick={handlePasswordClick}
                                                    variant="ghost"
                                                    _hover={{ bg: hover }}
                                                    aria-label="Toggle password visibility"
                                                />
                                            </InputRightElement>
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Box color={red}>{loginError}</Box>
                            <Button
                                type="submit"
                                isDisabled={!isValid || isSubmitting}
                                backgroundColor={contrast}
                                borderColor={contrast}
                                borderWidth="1px"
                                color={equity}
                                _hover={{bg:equity, color:contrast}}
                                mt={4}
                            >
                                Log In
                            </Button>
                            <Text mt={4}>
                                Don't have an Account?
                                <br />
                                <Link onClick={() => handleModeChange("/SignUp")}>
                                    Sign Up
                                </Link>
                            </Text>
                        </Form>
                    )}
                </Formik>
            )}

        </VStack>
                </Box>
            </Flex>
    );
};

export default Login;
