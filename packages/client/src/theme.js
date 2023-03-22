import { extendTheme } from "@chakra-ui/react";

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

const font = {

}

const customTheme = extendTheme({
    overrides,
    fonts: {
        heading: `'Exo 2', sans-serif`,
        body: `'Exo 2', sans-serif`,
    },
    config,
});

export default customTheme;
