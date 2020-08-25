import React, { ReactElement } from 'react';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Fade from 'react-reveal/Fade';
import ProjectThumbnail from './ProjectThumbnail';
import ArrowBack from '../../../assets/ArrowBack.svg';
import ArrowForward from '../../../assets/ArrowForward.svg';
import { Project } from '../../types';

const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(2, 0),
    display: 'grid',
    gridTemplateColumns: '40% 60%',
    width: '100%',

    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: 'auto',
    },
  },
  oddContainer: {
    gridTemplateColumns: '60% 40%',

    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: 'auto',
    },
  },
  viewButton: {
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.primary.contrastText,

    [theme.breakpoints.down('xs')]: {
      margin: `${theme.spacing(2)}px auto`,
    },
    '& svg': {
      margin: theme.spacing(0, 2),
    },
    '& line, path': {
      stroke: theme.palette.primary.main,
      fill: theme.palette.primary.main,
    },
  },
  arrow: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  description: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  oddDescription: {
    alignItems: 'flex-start',
    gridColumn: 2,
    gridRow: 1,
    [theme.breakpoints.down('xs')]: {
      gridRow: 2,
      gridColumn: 1,
    },
  },
  thumbnail: {
    display: 'flex',
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      gridRow: 1,
    },
  },
  oddThumbnail: {
    gridColumn: 1,
    gridRow: 1,
  },
  markdownContent: {
    ...theme.typography.body1,
    color: theme.palette.primary.main,
    margin: 0,
    paddingBottom: 0,

    '& h1, h2, h3': {
      ...theme.typography.h5,
      marginBottom: 0,
      color: theme.palette.primary.contrastText,
    },
    '& ul': {
      margin: 0,
      padding: 0,
      listStyleType: 'none',
    },
    '& li': {
      padding: 0,
      margin: theme.spacing(2, 0),
      lineHeight: '1rem',
      textAlign: isEven => (isEven ? 'right' : 'left'),
    },
  },
}));

interface ProjectContainerProps {
  data: Project;
  isEven: boolean;
}

const ProjectContainer = (props: ProjectContainerProps): ReactElement => {
  const { data, isEven } = props;
  const classes = useStyles(isEven);

  return (
    <div className={`${classes.container} ${!isEven ? classes.oddContainer : ''}`}>
      <div className={`${classes.description} ${!isEven ? classes.oddDescription : ''}`}>
        <Fade right cascade opposite delay={500}>
          <Typography variant="h5" color="primary" gutterBottom>
            {data.jobTitle}
          </Typography>

          <div
            className={classes.markdownContent}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: data.description.childMarkdownRemark.html }}
          />

          <Button variant="contained" className={classes.viewButton} component="a" href={data.url}>
            {!isEven && <ArrowBack className={classes.arrow} />}
            View Site
            {isEven && <ArrowForward className={classes.arrow} />}
          </Button>
        </Fade>
      </div>

      <div className={`${classes.thumbnail} ${!isEven ? classes.oddThumbnail : ''}`}>
        <ProjectThumbnail data={data} />
      </div>
    </div>
  );
};

export default ProjectContainer;
