import React from 'react';
import PropTypes from 'prop-types';
import Img from 'gatsby-image';
import { withStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';

const ProjectThumbnailCore = (props) => {
  const { classes, data } = props;

  return (
    <div className={classes.container}>
      <div className={classes.titleContainer}>
        <Typography
          variant="h3"
          color="primary"
          align="center"
          className={classes.title}
        >
          {data.title}
        </Typography>
      </div>

      <div className={classes.thumbnailContainer}>
        <Img fluid={data.coverImage.fluid} />
      </div>
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
    width: '100%',
    margin: theme.spacing.unit * 2,
  },
  titleContainer: {
    position: 'absolute',
    top: theme.spacing.unit * -3,
    zIndex: 2,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    backgroundColor: theme.palette.primary.contrastText,
    padding: theme.spacing.unit * 2,
  },
  thumbnailContainer: {
    padding: theme.spacing.unit * 2,
    opacity: '0.5',

    [theme.breakpoints.down('xs')]: {
      padding: 0,
    },
  },
});

export default withStyles(styles)(ProjectThumbnailCore);
