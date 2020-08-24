import React from 'react';
import PropTypes from 'prop-types';
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

const Layout = ({ children }) => {
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
            <ParallaxProvider>{children}</ParallaxProvider>
          </main>

          <Footer />
        </div>
      </RefContext.Provider>
    </ThemeProvider>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

export default Layout;
