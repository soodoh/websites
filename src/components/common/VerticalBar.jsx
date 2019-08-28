import React from 'react';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  bar: {
    width: 1,
    height: theme.spacing(8),
    backgroundColor: theme.palette.primary.contrastText,
  },
}));

const VerticalBar = () => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <div className={classes.bar} />
    </div>
  );
};

export default VerticalBar;
