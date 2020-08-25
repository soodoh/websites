import React, { ReactElement } from 'react';
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

interface ContactButtonProps {
  data: {
    id: string;
    label: string;
    url: string;
  }[];
}

const ContactButtons = (props: ContactButtonProps): ReactElement => {
  const classes = useStyles();
  const { data } = props;

  return (
    <div className={classes.container}>
      {data.map(contactInfo => (
        <Fab key={contactInfo.id} size="small" color="secondary" className={classes.button} component="a" href={contactInfo.url}>
          {contactInfo.label}
        </Fab>
      ))}
    </div>
  );
};

const ContactButtonsWithData = (): ReactElement => (
  <StaticQuery
    query={graphql`
      query ContactButtons {
        allContentfulContactInfo {
          edges {
            node {
              id
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
