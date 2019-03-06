import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import Fab from '@material-ui/core/Fab';

const ContactButtons = (props) => {
  const { classes } = props;

  return (
    <div className={classes.container}>
      <Fab size="small" color="secondary" className={classes.button}>
        GH
      </Fab>
      <Fab size="small" color="secondary" className={classes.button}>
        LI
      </Fab>
    </div>
  );
};

ContactButtons.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

const styles = theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  button: {
    margin: theme.spacing.unit,
  },
});

export default withStyles(styles)(ContactButtons);
