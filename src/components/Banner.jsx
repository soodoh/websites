import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { Parallax } from 'react-scroll-parallax';
import Fade from 'react-reveal/Fade';
import ArrowForward from '../../assets/ArrowForward.svg';
import ContactButtons from './common/ContactButtons';
import VerticalBar from './common/VerticalBar';

const useStyles = makeStyles(theme => ({
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: theme.palette.primary.contrastText,
  },
  titleBackground: {
    color: theme.palette.primary.light,
    position: 'absolute',
    top: '25vh',
    paddingLeft: '8vw',
    zIndex: -1,

    [theme.breakpoints.down('xs')]: {
      top: '18vh',
      paddingLeft: theme.spacing(2),
    },
  },
  titleGroup: {
    paddingTop: '32vh',
    paddingLeft: '10vw',
    flex: 1,

    [theme.breakpoints.down('xs')]: {
      paddingTop: '15vh',
      paddingLeft: theme.spacing(4),
    },
  },
  contactButton: {
    marginTop: theme.spacing(4),
    '& svg': {
      marginLeft: theme.spacing(2),
    },
    '& line, path': {
      stroke: theme.palette.primary.main,
      fill: theme.palette.primary.main,
    },
  },
  jobTitle: {
    fontSize: '1.5rem',
  },
  tagLine: {
    fontStyle: 'italic',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingRight: theme.spacing(6),

    [theme.breakpoints.down('xs')]: {
      position: 'absolute',
      top: 0,
      left: 0,
      paddingRight: 0,
      paddingLeft: theme.spacing(3),
      zIndex: theme.zIndex.appBar + 1,
    },
  },
  viewMore: {
    paddingBottom: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
}));

const Banner = (props) => {
  const classes = useStyles();
  const {
    title, jobTitle, tagLine, contact,
  } = props;
  const delayInterval = 500;

  return (
    <div className={classes.container}>
      <Parallax className={classes.titleBackground} y={[-60, 60]}>
        <Fade bottom opposite delay={delayInterval}>
          <Typography variant="h1">
            Paul
            <br />
            DiLoreto
          </Typography>
        </Fade>
      </Parallax>

      <Parallax className={classes.titleGroup} y={[5, -5]} x={[-10, 10]}>
        <Fade top opposite>
          <Typography variant="h2" color="inherit">
            {title}
          </Typography>

          <Typography variant="subtitle1" color="inherit" className={classes.jobTitle}>
            {jobTitle}
          </Typography>

          <Typography variant="subtitle1" color="inherit" className={classes.tagLine}>
            {tagLine}
          </Typography>

          <Button
            variant="contained"
            color="secondary"
            className={classes.contactButton}
            component="a"
            href={`mailto:${contact}`}
          >
            Contact Me
            <ArrowForward />
          </Button>
        </Fade>
      </Parallax>

      <div className={classes.buttonGroup}>
        <ContactButtons />
      </div>

      <div className={classes.viewMore}>
        <Fade bottom opposite delay={delayInterval * 3}>
          <Typography variant="subtitle1" color="inherit">
            View More
          </Typography>
          <VerticalBar />
        </Fade>
      </div>
    </div>
  );
};

Banner.propTypes = {
  title: PropTypes.string.isRequired,
  jobTitle: PropTypes.string.isRequired,
  tagLine: PropTypes.string.isRequired,
  contact: PropTypes.string.isRequired,
};

export default Banner;
