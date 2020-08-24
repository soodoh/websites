import React from 'react';
import PropTypes from 'prop-types';
import { uid } from 'react-uid';
import { StaticQuery, graphql } from 'gatsby';
import { makeStyles } from '@material-ui/styles';
import Fab from '@material-ui/core/Fab';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',

    [theme.breakpoints.down('xs')]: {
      flexDirection: 'row',
    },
  },
  button: {
    margin: theme.spacing(1),
  },
}));

const ContactButtons = props => {
  const classes = useStyles();
  const { data } = props;

  return (
    <div className={classes.container}>
      {data.map(contactInfo => (
        <Fab key={uid(contactInfo)} size='small' color='secondary' className={classes.button} component='a' href={contactInfo.url}>
          {contactInfo.label}
        </Fab>
      ))}
    </div>
  );
};

ContactButtons.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

const ContactButtonsWithData = () => (
  <StaticQuery
    query={graphql`
      query ContactButtons {
        allContentfulContactInfo {
          edges {
            node {
              label
              url
            }
          }
        }
      }
    `}
    render={data => <ContactButtons data={data.allContentfulContactInfo.edges.map(item => item.node)} />}
  />
);
export default ContactButtonsWithData;
