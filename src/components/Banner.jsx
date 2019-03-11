import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ArrowForward from '../../assets/ArrowForward.svg';
import Header from './Layout/Header';
import ContactButtons from './common/ContactButtons';
import VerticalBar from './common/VerticalBar';

const Banner = (props) => {
  const {
    classes, title, jobTitle, tagLine, contact,
  } = props;

  return (
    <div className={classes.container}>
      <Header />

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
          component={({ children, ...others }) => (
            <a {...others}>
              {children}
            </a>
          )}
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
  classes: PropTypes.shape({}).isRequired,
  title: PropTypes.string.isRequired,
  jobTitle: PropTypes.string.isRequired,
  tagLine: PropTypes.string.isRequired,
  contact: PropTypes.string.isRequired,
};

const styles = theme => ({
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
      paddingLeft: theme.spacing.unit * 2,
    },
  },
  titleGroup: {
    paddingTop: '25vh',
    paddingLeft: '10vw',
    flex: 1,

    [theme.breakpoints.down('xs')]: {
      paddingTop: '15vh',
      paddingLeft: theme.spacing.unit * 4,
    },
  },
  contactButton: {
    marginTop: theme.spacing.unit * 4,
    '& svg': {
      marginLeft: theme.spacing.unit * 2,
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
    paddingRight: theme.spacing.unit * 6,

    [theme.breakpoints.down('xs')]: {
      position: 'absolute',
      top: 0,
      left: 0,
      paddingRight: 0,
      paddingLeft: theme.spacing.unit * 3,
    },
  },
  viewMore: {
    paddingBottom: theme.spacing.unit * 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
});

export default withStyles(styles)(Banner);
