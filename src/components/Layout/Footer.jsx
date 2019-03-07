import React from 'react';
import PropTypes from 'prop-types';
import { StaticQuery, graphql } from 'gatsby';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ContactButtons from '../common/ContactButtons';
import ArrowForward from '../../../assets/ArrowForward.svg';

const FooterCore = (props) => {
  const { classes, contact } = props;

  return (
    <footer className={classes.container}>
      <ContactButtons />

      <div className={classes.contactMe}>
        <Typography variant="h6" color="secondary">
          Feel free to contact me at
        </Typography>

        <ArrowForward className={classes.arrow} />

        <Typography variant="h5" className={classes.contact}>
          {contact}
        </Typography>
      </div>
    </footer>
  );
};

FooterCore.propTypes = {
  classes: PropTypes.shape({
    footer: PropTypes.string,
    content: PropTypes.string,
  }).isRequired,
  contact: PropTypes.string.isRequired,
};

const styles = theme => ({
  container: {
    display: 'flex',
    color: theme.palette.primary.contrastText,
    padding: `${theme.spacing.unit * 6}px 10vw`,
    [theme.breakpoints.down('xs')]: {
      padding: `${theme.spacing.unit * 6}px ${theme.spacing.unit * 2}px`,
    },
  },
  contactMe: {
    marginLeft: theme.spacing.unit * 6,
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    margin: `0 ${theme.spacing.unit * 2}px`,
    '& line, path': {
      fill: theme.palette.primary.contrastText,
      stroke: theme.palette.primary.contrastText,
    },
  },
  contact: {
    color: theme.palette.primary.contrastText,
  },
});

const Footer = withStyles(styles)(FooterCore);

export default () => (
  <StaticQuery
    query={graphql`
      query Footer {
        contentfulAbout {
          contact
        }
      }
    `}
    render={data => (
      <Footer contact={data.contentfulAbout.contact} />
    )}
  />
);
