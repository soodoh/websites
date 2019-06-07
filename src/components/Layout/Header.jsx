import React from 'react';
import { makeStyles } from '@material-ui/styles';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/icons/Menu';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'row-reverse',
  },
  icon: {
    color: theme.palette.primary.contrastText,
  },
}));

const Header = () => {
  const classes = useStyles();

  return (
    <Toolbar className={classes.container}>
      <IconButton color="secondary">
        <Menu className={classes.icon} />
      </IconButton>
    </Toolbar>
  );
};

export default Header;
