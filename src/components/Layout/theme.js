const headerText = {
  fontFamily: '\'Fjalla One\', serif',
};
const bodyText = {
  fontFamily: '\'Geo\', serif',
};

const rawTheme = {
  palette: {
    background: {
      default: '#0E0827',
      light: '#9DC7E2',
      dark: '#969BCC',
    },
    primary: {
      light: '#1F294F',
      main: '#0E0827',
      dark: '#0E0827',
      contrastText: '#D7DFC2',
    },
    secondary: {
      light: '#C0D8E8',
      main: '#9DC7E2',
      dark: '#9DC7E2',
      contrastText: '#0E0827',
    },
  },
  typography: {
    useNextVariants: true,
    ...bodyText,
    h1: {
      ...headerText,
      textTransform: 'uppercase',
      fontSize: '10rem',
      zIndex: -1,
    },
    h2: {
      ...headerText,
    },
    h3: {
      ...headerText,
    },
    h4: {
      ...headerText,
    },
    h5: {
      ...headerText,
      zIndex: 'inherit',
    },
    h6: {
      ...headerText,
    },
    body1: {
      ...bodyText,
      fontSize: '1.2rem',
      paddingBottom: '1.5rem',
    },
  },
};

module.exports = rawTheme;
