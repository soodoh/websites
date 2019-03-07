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
      <IconButton color="secondary">
        <Menu className={classes.icon} />
      </IconButton>
    </Toolbar>
  );
};

Header.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

const styles = theme => ({
  container: {
    display: 'flex',
    flexDirection: 'row-reverse',
  },
  icon: {
    color: theme.palette.primary.contrastText,
  },
});

export default withStyles(styles)(Header);
