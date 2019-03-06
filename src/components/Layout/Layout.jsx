import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import theme from './theme';

const Layout = ({ children }) => (
  <MuiThemeProvider theme={createMuiTheme(theme)}>
    <CssBaseline />
    <Helmet>
      <html lang="en" />
    </Helmet>

    {children}
  </MuiThemeProvider>
);

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

export default Layout;
