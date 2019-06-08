import React, { useContext } from 'react';
import { navigate } from 'gatsby';
import { makeStyles } from '@material-ui/styles';
import Toolbar from '@material-ui/core/Toolbar';
import RefContext from '../common/RefContext';
import NavDrawer from './NavDrawer';

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
  const links = [
    { label: 'Work', onClick: () => handleScroll(workRef) },
    { label: 'About', onClick: () => handleScroll(aboutRef) },
    { label: 'Contact', onClick: () => handleScroll(contactRef) },
  ];

  return (
    <Toolbar className={classes.container}>
      {links.map(({ label, onClick }) => (
        <button
          key={`nav-${label}`}
          type="button"
          onClick={onClick}
          className={classes.navLink}
        >
          {label}
        </button>
      ))}

      <NavDrawer links={links} />
    </Toolbar>
  );
};

export default Header;
