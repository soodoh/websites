import React, { useContext } from 'react';
import { navigate } from 'gatsby';
import { makeStyles } from '@material-ui/styles';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/icons/Menu';
import RefContext from '../common/RefContext';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 5,
  },
  icon: {
    color: theme.palette.primary.contrastText,
  },
  navLink: {
    fontSize: '1rem',
    padding: theme.spacing(0, 6),
    color: theme.palette.primary.contrastText,
    backgroundColor: 'transparent',
    border: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',

    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  mobileMenu: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
}));

const handleScroll = (ref) => {
  if (!ref || !ref.current) {
    navigate('/');
  } else {
    ref.current.scrollIntoView({ behavior: 'smooth' });
  }
};

const Header = () => {
  const classes = useStyles();
  const { aboutRef, workRef, contactRef } = useContext(RefContext);

  return (
    <Toolbar className={classes.container}>
      <button
        type="button"
        onClick={() => handleScroll(workRef)}
        className={classes.navLink}
      >
        Work
      </button>
      <button
        type="button"
        onClick={() => handleScroll(aboutRef)}
        className={classes.navLink}
      >
        About
      </button>
      <button
        type="button"
        onClick={() => handleScroll(contactRef)}
        className={classes.navLink}
      >
        Contact
      </button>

      <IconButton color="secondary" className={classes.mobileMenu}>
        <Menu className={classes.icon} />
      </IconButton>
    </Toolbar>
  );
};

export default Header;
