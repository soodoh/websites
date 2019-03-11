import React from 'react';
import PropTypes from 'prop-types';
import Img from 'gatsby-image';
import { withStyles } from '@material-ui/core';

const ProjectThumbnailCore = (props) => {
  const { classes, data } = props;

  return (
    <div className={classes.container}>

      <Img fluid={data.coverImage.fluid} />
    </div>
  );
};

ProjectThumbnailCore.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  data: PropTypes.shape({
    title: PropTypes.string.isRequired,
    coverImage: PropTypes.object.isRequired,
  }).isRequired,
};

const styles = theme => ({
  container: {
    position: 'relative',
    padding: theme.spacing.unit * 2,
  },
});

export default withStyles(styles)(ProjectThumbnailCore);
