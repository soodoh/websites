import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ArrowForward from '@material-ui/icons/ArrowForward';
import Header from './Layout/Header';
import ContactButtons from './common/ContactButtons';
import VerticalBar from './common/VerticalBar';

const Banner = (props) => {
  const {
    classes, title, jobTitle, tagLine,
  } = props;

  return (
    <div className={classes.container}>
      <Header />

      <div className={classes.titleGroup}>
        <Typography variant="h2" color="inherit" gutterBottom>
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
};

const styles = theme => ({
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: theme.palette.primary.contrastText,
  },
  titleGroup: {
    marginTop: '25vh',
    marginLeft: '10vw',
    flex: 1,
    [theme.breakpoints.down('xs')]: {
      marginTop: '15vh',
      marginLeft: theme.spacing.unit * 3,
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
    marginRight: theme.spacing.unit * 6,
    [theme.breakpoints.down('xs')]: {
      marginRight: theme.spacing.unit * 3,
    },
  },
  viewMore: {
    marginBottom: theme.spacing.unit * 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
});

export default withStyles(styles)(Banner);
