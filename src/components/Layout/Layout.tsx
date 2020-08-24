import React, { ReactElement } from 'react';
import { Helmet } from 'react-helmet';
import { createMuiTheme } from '@material-ui/core/styles';
import { makeStyles, ThemeProvider } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ParallaxProvider } from 'react-scroll-parallax';
import theme from './theme';
import Header from './Header';
import Footer from './Footer';
import RefContext from '../common/RefContext';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  content: {
    flex: 1,
  },
});

interface LayoutProps {
  children?: ReactElement[];
  location: {
    pathname: string;
  };
}

const Layout = (props: LayoutProps): ReactElement => {
  const workRef = React.createRef();
  const aboutRef = React.createRef();
  const contactRef = React.createRef();
  const classes = useStyles();

  return (
    <ThemeProvider theme={createMuiTheme(theme)}>
      <CssBaseline />
      <Helmet>
        <html lang="en" />
      </Helmet>

      <RefContext.Provider
        value={{
          workRef,
          aboutRef,
          contactRef,
        }}
      >
        <div className={classes.container}>
          <Header />

          <main className={classes.content}>
            <ParallaxProvider>{props.children}</ParallaxProvider>
          </main>

          <Footer />
        </div>
      </RefContext.Provider>
    </ThemeProvider>
  );
};

export default Layout;
