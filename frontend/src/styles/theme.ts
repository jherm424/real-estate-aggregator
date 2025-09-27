import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
    secondary: {
      50: '#f3e5f5',
      100: '#e1bee7',
      200: '#ce93d8',
      300: '#ba68c8',
      400: '#ab47bc',
      500: '#9c27b0',
      600: '#8e24aa',
      700: '#7b1fa2',
      800: '#6a1b9a',
      900: '#4a148c',
    },
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'primary',
      },
      variants: {
        solid: {
          borderRadius: 'md',
          fontWeight: 'medium',
        },
        outline: {
          borderRadius: 'md',
          fontWeight: 'medium',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          overflow: 'hidden',
          boxShadow: 'md',
          _hover: {
            boxShadow: 'lg',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s',
          },
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'primary.500',
      },
      variants: {
        filled: {
          field: {
            borderRadius: 'md',
          },
        },
        outline: {
          field: {
            borderRadius: 'md',
          },
        },
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'primary.500',
      },
      variants: {
        filled: {
          field: {
            borderRadius: 'md',
          },
        },
        outline: {
          field: {
            borderRadius: 'md',
          },
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
});

export default theme;