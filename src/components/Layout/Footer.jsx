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
          FEEL FREE TO CONTACT ME AT
        </Typography>

        <Typography variant="h6" className={classes.contact}>
          <ArrowForward className={classes.arrow} />
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
    flexWrap: 'wrap',
    color: theme.palette.primary.contrastText,
    paddingBottom: theme.spacing.unit * 6,
    paddingLeft: '10vw',
    paddingRight: '10vw',

    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column-reverse',
      alignItems: 'center',
      paddingLeft: theme.spacing.unit * 2,
      paddingRight: theme.spacing.unit * 2,
    },
  },
  contactMe: {
    flex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',

    [theme.breakpoints.down('xs')]: {
      justifyContent: 'flex-start',
      marginBottom: theme.spacing.unit * 6,
    },
  },
  arrow: {
    margin: `0 ${theme.spacing.unit * 2}px`,
    '& line, path': {
      fill: theme.palette.primary.contrastText,
      stroke: theme.palette.primary.contrastText,
    },
  },
  contact: {
    display: 'flex',
    alignItems: 'center',
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
