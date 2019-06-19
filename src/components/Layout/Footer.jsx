import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { StaticQuery, graphql } from 'gatsby';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Fade from 'react-reveal/Fade';
import ContactButtons from '../common/ContactButtons';
import ArrowForward from '../../../assets/ArrowForward.svg';
import RefContext from '../common/RefContext';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    color: theme.palette.primary.contrastText,
    paddingBottom: theme.spacing(6),
    paddingLeft: '10vw',
    paddingRight: '10vw',

    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column-reverse',
      alignItems: 'center',
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
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
      marginBottom: theme.spacing(6),
    },
  },
  arrow: {
    margin: theme.spacing(0, 2),
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
}));

const Footer = (props) => {
  const classes = useStyles();
  const { contact } = props;
  const { contactRef } = useContext(RefContext);

  return (
    <footer className={classes.container} ref={contactRef}>
      <ContactButtons />

      <div className={classes.contactMe}>
        <Fade right opposite delay={500}>
          <Typography variant="h6" color="secondary" style={{ textTransform: 'uppercase' }}>
            Feel free to contact me at
          </Typography>

          <Typography variant="h6" className={classes.contact}>
            <ArrowForward className={classes.arrow} />
            {contact}
          </Typography>
        </Fade>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  contact: PropTypes.string.isRequired,
};

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
