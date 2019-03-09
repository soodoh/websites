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
      <Typography variant="h1" align="center" className={classes.title}>
        About Me
      </Typography>

      <div className={classes.portrait}>
        <Img fluid={portrait.fluid} className={classes.portraitFilter} />
      </div>

      <div className={classes.grid}>
        <Typography variant="h5" color="inherit">
          About
        </Typography>
        <div
          className={classNames(classes.markdownContent, classes.about)}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: aboutContent }}
        />

        <Typography variant="h5" color="inherit">
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
    paddingTop: theme.spacing.unit * 6,
    paddingLeft: '10vw',
    paddingRight: '10vw',

    [theme.breakpoints.down('xs')]: {
      paddingLeft: '10vw',
      paddingRight: '10vw',
    },
  },
  title: {
    position: 'absolute',
    margin: '0 auto',
    color: theme.palette.primary.light,
    whiteSpace: 'nowrap',
    paddingLeft: '10vw',

    [theme.breakpoints.down('sm')]: {
      top: theme.spacing.unit * 15,
      left: 0,
    },
  },
  grid: {
    color: theme.palette.secondary.light,
    marginTop: theme.spacing.unit * 13,
    display: 'grid',
    gridTemplateColumns: `${theme.spacing.unit * 10}px auto`,
    gridTemplateRows: 'auto auto',

    [theme.breakpoints.down('xs')]: {
      marginTop: theme.spacing.unit * 6,
      gridTemplateColumns: 'auto',
    },
  },
  about: {
    paddingRight: theme.spacing.unit * 20,

    [theme.breakpoints.down('sm')]: {
      paddingRight: 0,
    },
  },
  portraitFilter: {
    backgroundColor: theme.palette.background.default,
    '& img, picture': {
      opacity: '0.5',
    },
  },
  portrait: {
    position: 'absolute',
    top: theme.spacing.unit * 15,
    right: theme.spacing.unit * 6,
    width: '30vw',
    minWidth: 200,
    maxWidth: 400,
    zIndex: -1,

    [theme.breakpoints.down('sm')]: {
      position: 'relative',
      top: theme.spacing.unit * 20,
      right: 0,
      width: '100%',
      padding: `0 ${theme.spacing.unit * 6}px`,
      margin: '0 auto',
    },
  },
  markdownContent: {
    ...theme.typography.body1,
    color: theme.palette.primary.contrastText,
    '& h1, h2, h3': {
      ...theme.typography.h5,
      marginBottom: 0,
      color: theme.palette.primary.contrastText,
    },
    '& ul': {
      marginTop: 0,
      padding: 0,
      display: 'grid',
      gridTemplateColumns: '50% 50%',
      marginLeft: theme.spacing.unit * -4,
      listStyleType: 'none',

      [theme.breakpoints.down('xs')]: {
        gridTemplateColumns: 'auto',
        marginLeft: 0,
      },
    },
    '& ul li:before': {
      content: '"\\2014"',
      paddingRight: theme.spacing.unit,
    },
    '& p, li': {
      margin: 0,
      padding: 0,
    },
  },
});

export default withStyles(styles)(About);
