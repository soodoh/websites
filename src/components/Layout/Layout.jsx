import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import theme from './theme';

const Layout = ({ children }) => (
  <ThemeProvider theme={createMuiTheme(theme)}>
    <CssBaseline />
    <Helmet>
      <html lang="en" />
    </Helmet>

    {children}
  </ThemeProvider>
);

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

export default Layout;
