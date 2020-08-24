import React, { ReactElement, useContext } from 'react';
import { navigate } from 'gatsby';
import { makeStyles } from '@material-ui/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Slide from '@material-ui/core/Slide';
import useScrollTrigger from '@material-ui/core/useScrollTrigger';
import RefContext from '../common/RefContext';
import NavDrawer from './NavDrawer';

const useStyles = makeStyles(theme => ({
  appBar: {
    boxShadow: 'none',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  navLink: {
    fontSize: '1rem',
    padding: theme.spacing(0, 6),
    color: theme.palette.primary.contrastText,
    backgroundColor: 'transparent',
    border: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    textTransform: 'lowercase',

    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
}));

const handleScroll = ref => {
  if (!ref || !ref.current) {
    navigate('/');
  } else {
    ref.current.scrollIntoView({ behavior: 'smooth' });
  }
};

const Header = (): ReactElement => {
  const classes = useStyles();
  const { aboutRef, workRef, contactRef } = useContext(RefContext);
  const links = [
    { label: 'Work', onClick: () => handleScroll(workRef) },
    { label: 'About', onClick: () => handleScroll(aboutRef) },
    { label: 'Contact', onClick: () => handleScroll(contactRef) },
  ];
  const trigger = useScrollTrigger();

  return (
    <Slide direction="down" appear={false} in={!trigger}>
      <AppBar position="fixed" color="primary" className={classes.appBar}>
        <Toolbar className={classes.toolbar}>
          {links.map(({ label, onClick }) => (
            <button key={`nav-${label}`} type="button" onClick={onClick} className={classes.navLink}>
              {label}
            </button>
          ))}

          <NavDrawer links={links} />
        </Toolbar>
      </AppBar>
    </Slide>
  );
};

export default Header;
