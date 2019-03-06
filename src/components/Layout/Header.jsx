import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/icons/Menu';
// import { Link, StaticQuery, graphql } from 'gatsby';

const Header = (props) => {
  const { classes } = props;

  return (
    <Toolbar className={classes.container}>
      <IconButton>
        <Menu />
      </IconButton>
    </Toolbar>
  );
};

Header.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row-reverse',
  },
};

export default withStyles(styles)(Header);
