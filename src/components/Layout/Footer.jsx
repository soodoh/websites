import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

const FooterCore = (props) => {
  const { classes } = props;

  return (
    <footer className={classes.container}>
      <div>
        Footer
      </div>
    </footer>
  );
};

FooterCore.propTypes = {
  classes: PropTypes.shape({
    footer: PropTypes.string,
    content: PropTypes.string,
  }).isRequired,
};

const styles = theme => ({
  container: {
    padding: theme.spacing.unit * 2,
  },
});

export default withStyles(styles)(FooterCore);
