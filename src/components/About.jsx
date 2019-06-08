import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Img from 'gatsby-image';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import RefContext from './common/RefContext';

const useStyles = makeStyles(theme => ({
  container: {
    position: 'relative',
    paddingTop: theme.spacing(6),
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
      left: 0,
    },
  },
  grid: {
    color: theme.palette.secondary.main,
    marginTop: theme.spacing(13),
    display: 'grid',
    gridTemplateColumns: `${theme.spacing(10)}px auto`,
    gridTemplateRows: 'auto auto',

    [theme.breakpoints.down('xs')]: {
      marginTop: theme.spacing(6),
      gridTemplateColumns: 'auto',
    },
    [theme.breakpoints.down('sm')]: {
      marginTop: 0,
    },
  },
  about: {
    paddingRight: theme.spacing(20),

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
    top: theme.spacing(15),
    right: theme.spacing(6),
    width: '30vw',
    minWidth: 200,
    maxWidth: 400,
    zIndex: -1,

    [theme.breakpoints.down('sm')]: {
      position: 'relative',
      top: theme.spacing(9),
      right: 0,
      width: '100%',
      padding: theme.spacing(0, 6),
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
      marginLeft: theme.spacing(1),
      listStyleType: 'none',

      [theme.breakpoints.down('xs')]: {
        gridTemplateColumns: 'auto',
      },
    },
    '& ul li:before': {
      content: '"+"',
      paddingRight: theme.spacing(1),
    },
    '& p, li': {
      margin: 0,
      padding: 0,
    },
    '& li': {
      marginRight: theme.spacing(1),
    },
  },
}));

const About = (props) => {
  const classes = useStyles();
  const {
    aboutContent, skillsContent, portrait,
  } = props;
  const { aboutRef } = useContext(RefContext);

  return (
    <div className={classes.container}>
      <Typography variant="h1" align="center" className={classes.title} ref={aboutRef}>
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
  portrait: PropTypes.shape({
    fluid: PropTypes.object.isRequired,
  }).isRequired,
  aboutContent: PropTypes.string.isRequired,
  skillsContent: PropTypes.string.isRequired,
};

export default About;
