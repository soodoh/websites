import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Img from 'gatsby-image';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const About = (props) => {
  const {
    classes, aboutContent, skillsContent, portrait,
  } = props;

  return (
    <div className={classes.container}>
      <Typography variant="h1" align="center">
        About Me
      </Typography>

      <div className={classes.portrait}>
        <Img fluid={portrait.fluid} />
      </div>

      <div className={classes.grid}>
        <Typography variant="h5">
          About
        </Typography>
        <div
          className={classNames(classes.markdownContent, classes.about)}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: aboutContent }}
        />

        <Typography variant="h5">
          Skills
        </Typography>
        <div
          className={classes.markdownContent}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: skillsContent }}
        />
      </div>
    </div>
  );
};

About.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  portrait: PropTypes.shape({
    fluid: PropTypes.object.isRequired,
  }).isRequired,
  aboutContent: PropTypes.string.isRequired,
  skillsContent: PropTypes.string.isRequired,
};

const styles = theme => ({
  container: {
    position: 'relative',
    padding: `${theme.spacing.unit * 6}px 10vw`,
    [theme.breakpoints.down('xs')]: {
      padding: `${theme.spacing.unit * 6}px ${theme.spacing.unit * 2}px`,
    },
  },
  grid: {
    marginTop: theme.spacing.unit * 6,
    display: 'grid',
    gridTemplateColumns: `${theme.spacing.unit * 10}px auto`,
    gridTemplateRows: 'auto auto',
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: 'auto',
    },
  },
  about: {
    paddingRight: theme.spacing.unit * 20,
    [theme.breakpoints.down('sm')]: {
      paddingRight: 0,
    },
  },
  portrait: {
    position: 'absolute',
    top: theme.spacing.unit * 15,
    right: theme.spacing.unit * 6,
    width: '30vw',
    minWidth: 200,
    maxWidth: 500,
    zIndex: -1,
    [theme.breakpoints.down('sm')]: {
      position: 'relative',

    },
  },
  markdownContent: {
    '& h1, h2, h3': {
      ...theme.typography.h5,
      marginBottom: 0,
    },
    ...theme.typography.body1,
    '& ul': {
      marginTop: 0,
      padding: 0,
      display: 'grid',
      gridTemplateColumns: '50% 50%',
      [theme.breakpoints.down('xs')]: {
        gridTemplateColumns: 'auto',
      },
    },
    '& p, li': {
      margin: 0,
      padding: 0,
    },
    '& li': {
      marginLeft: theme.spacing.unit * -2,
    },
  },
});

export default withStyles(styles)(About);
