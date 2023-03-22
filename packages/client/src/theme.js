import {Button, extendTheme} from "@chakra-ui/react";

const overrides = {
    components: {
        Input: {
            baseStyle: {
                focusBorderColor: "purple.500",
            },
        },
        PasswordInput: {
            baseStyle: {
                focusBorderColor: "purple.500",
            }
        }
    }
}

/*const colors = {
    brown: {
        100: "#d9d0b4",
        200: "#ccbf9a",
        500: "#7d6b57",
        700: "#5f5330",
    },
    green: {
        200: "#879e82",
        500: "#666b5e",
        700: "#292b26",
    },
    tertiary: {
        500: "#7d6b57",
    },
    quaternary: {
        500: "#ccbf9a",
    },

};*/

const config = {
    initialColorMode: "light",
    useSystemColorMode: false,
};

const button = {
    Button: {
        variants: {
            'start-game': {
                bg: {
                    light: "gray.200",
                    dark: "purple.600"
                },
                color: {
                    light: "purple.500",
                    dark: "white",
                }
            }
        }
    }
}

const customTheme = extendTheme({
    overrides,
    fonts: {
        heading: `'Exo 2', sans-serif`,
        body: `'Exo 2', sans-serif`,
    },
    components: {
        Button: {
            variants: {
                'start-game-light': {
                    bg: "gray.200",
                    color: "black",
                    _hover: {
                        bg: "purple.200",
                    }
                },
                'start-game-dark': {
                    bg: "purple.700",
                    color: "white",
                    _hover: {
                        bg: "purple.600"
                    }
                },
                'primary-light': {
                    bg: "purple.500",
                    color: "white",
                    borderWidth:"1px",
                    borderColor:"purple.500",
                    marginRight:"1rem",
                    _hover: {
                        bg: "transparent",
                        color: "purple.500",
                    }
                },
                'primary-dark': {
                    bg: "white",
                    color: "purple.500",
                    borderWidth: "1px",
                    borderColor: "white",
                    marginRight:"1rem",
                    _hover: {
                        bg: "transparent",
                        color: "white",
                    }
                },
                'secondary-light': {
                    bg:"transparent",
                    color:"purple.500",
                    borderWidth:"1px",
                    borderColor: "purple.500",
                    marginRight:"1rem",
                    _hover: {
                        bg: "purple.500",
                        color: "white",
                    }
                },
                'secondary-dark': {
                    bg:"transparent",
                    color:"white",
                    borderWidth:"1px",
                    borderColor: "white",
                    marginRight:"1rem",
                    _hover: {
                        bg: "white",
                        color: "purple.500",
                    }
                }
            }
        },
    },
    config,
});

export default customTheme;
