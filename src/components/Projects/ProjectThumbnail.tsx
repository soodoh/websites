import React from 'react';
import PropTypes from 'prop-types';
import Img from 'gatsby-image';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Fade from 'react-reveal/Fade';

const useStyles = makeStyles(theme => ({
  container: {
    position: 'relative',
    width: '100%',
    margin: theme.spacing(2),
  },
  titleContainer: {
    position: 'absolute',
    top: theme.spacing(-3),
    zIndex: 3,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    backgroundColor: theme.palette.primary.contrastText,
    padding: theme.spacing(2),
  },
  thumbnail: {
    padding: theme.spacing(2),
    opacity: '0.5',
    zIndex: 2,

    [theme.breakpoints.down('xs')]: {
      padding: 0,
    },
  },
}));

const ProjectThumbnail = props => {
  const classes = useStyles();
  const { data } = props;

  return (
    <div className={classes.container}>
      <Fade left opposite>
        <div className={classes.titleContainer}>
          <Typography variant="h3" color="primary" align="center" className={classes.title}>
            {data.title}
          </Typography>
        </div>

        <Img className={classes.thumbnail} fluid={data.coverImage.fluid} />
      </Fade>
    </div>
  );
};

ProjectThumbnail.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string.isRequired,
    coverImage: PropTypes.object.isRequired,
  }).isRequired,
};

export default ProjectThumbnail;
