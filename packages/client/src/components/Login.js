import React, {useState, useContext, useEffect} from "react";
import {Formik, Form, Field, ErrorMessage, useFormik} from 'formik';
import {AccountContext} from "../AccountContext.js";
import {LoginSchema, SignUpSchema} from "@gambit/common"
import {useNavigate} from 'react-router-dom';
import socket from "../Socket.js";
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

const Login = (props) => {
    const {setUser} = useContext(AccountContext);
    const [mode, setMode] = useState(props.mode);
    const [loginError, setLoginError] = useState(null);
    const [signUpError, setSignUpError] = useState(null);
    const navigate = useNavigate();
    const contrast = useColorModeValue("purple.500", "white");
    const equity = useColorModeValue("white", "purple.500");
    const bg = useColorModeValue("white", "purple.500");
    const red = useColorModeValue("red.500", "red.300");
    const hover = useColorModeValue("purple.200", "purple.700");
    const [showPassword, setShowPassword] = useState(false);


    useEffect(() => {
        socket.connect();
    }, []);

    useEffect(() => {
        setMode(props.mode);
    }, [props]);

    const handleClick = () => setShowPassword(!showPassword);


    const handleModeChange = (newMode) => {
        setMode(newMode);
    };

    const submitSignUp = (values) => {
        fetch("http://localhost:4000/auth/signup", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values)
        }).catch(err => {
            console.log(err);
        }).then(res => {
            if (!res || !res.ok || res.status >= 400) {
                console.log(res);
            }
            return res.json();
        }).then(data => {
            if (!data.loggedIn) {
                setSignUpError(data.message);
                return;
            }
            socket.emit('login');
            setUser({...data});
            setSignUpError(null);
            navigate('/');
        })
    }

    const submitLogin = (values, setSubmitting) => {
        fetch("http://localhost:4000/auth/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values)
        })
            .catch(err => {
                console.log(err);
                setSubmitting(false);
                return;
            })
            .then(res => {
                console.log(res);
                if (!res || !res.ok || res.status >= 400) {
                    setSubmitting(false);
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
                socket.emit('login');
                navigate('/');
            });
    }

    return (
            <Flex width="100vw" height="70vh" alignItems="center" justifyContent="center" paddingTop="10vh" color={contrast}>
                <Box backgroundColor={bg} borderRadius="md" p={6} width="600px" boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)">
        <VStack spacing={4}>
            {mode === "login" && (
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
                                                    onClick={handleClick}
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
                                <Link onClick={() => handleModeChange("signUp")}>
                                    Sign Up
                                </Link>
                            </Text>
                        </Form>
                    )}
                </Formik>
            )}
            {mode === "signUp" && (
                <Formik
                    initialValues={{
                        username: "",
                        email: "",
                        password: "",
                        passwordRepeat: "",
                    }}
                    validationSchema={SignUpSchema}
                    validateOnChange={true}
                    onSubmit={(values, { setSubmitting }) => {
                        submitSignUp(values);
                        setSubmitting(false);
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
                                        <Input {...field} id="username" />
                                        <FormErrorMessage>{form.errors.username}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="email">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.email && form.touched.email}>
                                        <FormLabel htmlFor="email">Email</FormLabel>
                                        <Input {...field} id="email" />
                                        <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="password">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.password && form.touched.password}>
                                        <FormLabel htmlFor="password">Password</FormLabel>
                                        <InputGroup>
                                            <Input {...field} id="password" type={showPassword ? 'text' : 'password'} />
                                            <InputRightElement>
                                                <IconButton
                                                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                                    onClick={handleClick}
                                                    variant="ghost"
                                                    aria-label="Toggle password visibility"
                                                    _hover={{ bg: hover }}
                                                />
                                            </InputRightElement>
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="passwordRepeat">
                                {({ field, form }) => (
                                    <FormControl
                                        isInvalid={form.errors.passwordRepeat && form.touched.passwordRepeat}
                                    >
                                        <FormLabel htmlFor="passwordRepeat">Repeat password</FormLabel>
                                        <InputGroup>
                                            <Input
                                                {...field}
                                                id="passwordRepeat"
                                                type={showPassword ? 'text' : 'password'}
                                            />
                                            <InputRightElement>
                                                <IconButton
                                                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                                    onClick={handleClick}
                                                    variant="ghost"
                                                    aria-label="Toggle password visibility"
                                                    _hover={{ bg: hover }}
                                                />
                                            </InputRightElement>
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.passwordRepeat}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Box color={red}>{signUpError}</Box>
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
                                Sign Up
                            </Button>
                            <Text mt={4}>
                                Already have an Account?
                                <br />
                                <Link onClick={() => handleModeChange("login")}>
                                    Log in
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
