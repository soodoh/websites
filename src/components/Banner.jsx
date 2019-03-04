import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';

const Banner = (props) => {
  const {
    classes, title, jobTitle, tagLine,
  } = props;

  return (
    <div className={classes.container}>
      <Typography variant="h2" gutterBottom>
        {title}
      </Typography>

      <Typography variant="h5">
        {jobTitle}
      </Typography>

      <Typography variant="subtitle1">
        {tagLine}
      </Typography>
    </div>
  );
};

Banner.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  title: PropTypes.string.isRequired,
  jobTitle: PropTypes.string.isRequired,
  tagLine: PropTypes.string.isRequired,
};

const styles = theme => ({
  container: {
    padding: theme.spacing.unit * 2,
  },
});

export default withStyles(styles)(Banner);
