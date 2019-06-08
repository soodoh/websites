import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
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
    zIndex: 6,

    [theme.breakpoints.down('xs')]: {
      position: 'absolute',
      top: 0,
      left: 0,
      paddingRight: 0,
      paddingLeft: theme.spacing(3),
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

  return (
    <div className={classes.container}>
      <Typography variant="h1" className={classes.titleBackground}>
        Paul
        <br />
        DiLoreto
      </Typography>

      <div className={classes.titleGroup}>
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
      </div>

      <div className={classes.buttonGroup}>
        <ContactButtons />
      </div>

      <div className={classes.viewMore}>
        <Typography variant="subtitle1" color="inherit">
          View More
        </Typography>
        <VerticalBar />
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
