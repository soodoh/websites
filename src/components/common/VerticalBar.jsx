import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';

const VerticalBar = (props) => {
  const { classes } = props;

  return (
    <div className={classes.container}>
      <div className={classes.bar} />
    </div>
  );
};

VerticalBar.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

const styles = theme => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  bar: {
    width: 1,
    height: theme.spacing.unit * 8,
    backgroundColor: theme.palette.primary.contrastText,
  },
});

export default withStyles(styles)(VerticalBar);
