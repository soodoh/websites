import React, { ReactElement, useState } from 'react';
import { makeStyles } from '@material-ui/styles';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/icons/Menu';
import ArrowRight from '@material-ui/icons/KeyboardArrowRight';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const useStyles = makeStyles(theme => ({
  menuButton: {
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  list: {
    width: theme.spacing(30),
  },
  listItem: {
    '&:first-child': {
      borderTop: `1px solid ${theme.palette.secondary.light}`,
    },
    borderBottom: `1px solid ${theme.palette.secondary.light}`,
    textTransform: 'lowercase',
  },
  drawerTop: {
    display: 'flex',
    justifyContent: 'flex-start',
    padding: theme.spacing(0.5),
  },
  drawer: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.primary.main,
  },
}));

interface NavDrawerProps {
  links: {
    label: string;
    onClick: () => void;
  }[];
}

const NavDrawer = (props: NavDrawerProps): ReactElement => {
  const classes = useStyles();
  const [isActive, setActive] = useState(false);

  return (
    <>
      <IconButton color="secondary" className={classes.menuButton} onClick={() => setActive(true)}>
        <Menu />
      </IconButton>

      <Drawer
        anchor="right"
        open={isActive}
        classes={{ paper: classes.drawer }}
        onClose={() => setActive(false)}
        ModalProps={{ disableRestoreFocus: true }}
      >
        <div className={classes.drawerTop}>
          <IconButton color="primary" onClick={() => setActive(false)}>
            <ArrowRight />
          </IconButton>
        </div>

        <List className={classes.list}>
          {props.links.map(({ label, onClick }) => (
            <ListItem button className={classes.listItem} key={`mobile-${label}`}>
              <ListItemText
                primary={label}
                onClick={() => {
                  setActive(false);
                  onClick();
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
};

export default NavDrawer;
