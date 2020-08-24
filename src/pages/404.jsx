import React from 'react';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/styles';
import Metadata from '../components/common/Metadata';

const useStyles = makeStyles(theme => ({
  container: {
    marginTop: theme.spacing(4),
    padding: '25vh',
  },
}));

const NotFound = () => {
  const classes = useStyles();

  return (
    <>
      <Metadata title='PD: Page Not Found' robots='noindex, nofollow' />

      <div className={classes.container}>
        <Typography variant='h3' color='secondary' align='center' gutterBottom>
          404: Page Not Found
        </Typography>
        <Typography variant='h6' color='secondary' align='center'>
          Please check your URL, or select something from the nav bar
        </Typography>
      </div>
    </>
  );
};

export default NotFound;
