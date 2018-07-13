import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
// import { Link, StaticQuery, graphql } from 'gatsby';

const Header = (props) => {
  const { classes } = props;

  return (
    <div className={classes.container}>
      Hello World!
    </div>
  );
};

Header.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

const styles = theme => ({
  container: {
    padding: `0 ${theme.spacing.unit * 2}px`,
  },
});

export default withStyles(styles)(Header);
