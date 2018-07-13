import React from 'react';
import PropTypes from 'prop-types';
// import { StaticQuery, graphql } from 'gatsby';
import { withStyles } from '@material-ui/core/styles';
import Metadata from '../components/common/Metadata';

const HomeCore = (props) => {
  const { classes } = props;

  return (
    <React.Fragment>
      <Metadata
        title="PD Portfolio"
        description="Paul DiLoreto is a Full Stack Software Engineer currently working at 20th Century Fox. View portfolio for more info."
      />

      <div className={classes.container}>
        Hello World
      </div>
    </React.Fragment>
  );
};

HomeCore.propTypes = {
  classes: PropTypes.shape({
    home: PropTypes.string,
    buttonGroup: PropTypes.string,
  }).isRequired,
};

const styles = theme => ({
  container: {
    padding: `${theme.spacing.unit * 6}px '10vw`,
    [theme.breakpoints.down('xs')]: {
      padding: `${theme.spacing.unit * 6}px ${theme.spacing.unit * 2}px`,
    },
  },
});

export default withStyles(styles)(HomeCore);
