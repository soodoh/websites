import React, { ReactElement } from 'react';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  firstColor: {
    backgroundColor: theme.palette.background.light,
    flex: 1,
  },
  secondColor: {
    backgroundColor: theme.palette.background.dark,
    flex: 1,
  },
  halfway: {
    background: `linear-gradient(to bottom, ${theme.palette.background.light}, ${theme.palette.background.dark})`,
    height: theme.spacing(16),
  },
}));

const GradientBackground = (): ReactElement => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <div className={classes.firstColor} />
      <div className={classes.halfway} />
      <div className={classes.secondColor} />
    </div>
  );
};

export default GradientBackground;
