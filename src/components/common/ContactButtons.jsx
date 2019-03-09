import React from 'react';
import PropTypes from 'prop-types';
import { uid } from 'react-uid';
import { StaticQuery, graphql } from 'gatsby';
import { withStyles } from '@material-ui/core';
import Fab from '@material-ui/core/Fab';

const ContactButtonsCore = (props) => {
  const { classes, data } = props;

  return (
    <div className={classes.container}>
      {data.map(contactInfo => (
        <Fab
          key={uid(contactInfo)}
          size="small"
          color="secondary"
          className={classes.button}
          component={({ children, ...others }) => (
            <a {...others}>{children}</a>
          )}
          href={contactInfo.url}
        >
          {contactInfo.label}
        </Fab>
      ))}
    </div>
  );
};

ContactButtonsCore.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

const styles = theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',

    [theme.breakpoints.down('xs')]: {
      flexDirection: 'row',
    },
  },
  button: {
    margin: theme.spacing.unit,
  },
});

const ContactButtons = withStyles(styles)(ContactButtonsCore);

export default () => (
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
    render={data => (
      <ContactButtons data={data.allContentfulContactInfo.edges.map(item => item.node)} />
    )}
  />
);
