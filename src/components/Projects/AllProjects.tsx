import React, { ReactElement, useContext } from 'react';
import { uid } from 'react-uid';
import { StaticQuery, graphql } from 'gatsby';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import { Parallax } from 'react-scroll-parallax';
import ProjectContainer from './ProjectContainer';
import VerticalBar from '../common/VerticalBar';
import GradientBackground from './GradientBackground';
import RefContext from '../common/RefContext';
import { Project } from '../../types';

const useStyles = makeStyles(theme => ({
  container: {
    position: 'relative',
    backgroundColor: theme.palette.background.light,
    padding: '0 10vw',

    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(0, 2),
    },
  },
  projectTitle: {
    position: 'absolute',
    top: theme.spacing(4),
    left: '8vw',
    color: theme.palette.secondary.light,
    zIndex: 1,

    [theme.breakpoints.down('xs')]: {
      left: theme.spacing(2),
    },
  },
  projectsContainer: {
    paddingTop: theme.spacing(15),
  },
  topGradient: {
    height: theme.spacing(16),
    background: `linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.background.light})`,
  },
  bottomGradient: {
    height: theme.spacing(24),
    background: `linear-gradient(to bottom, ${theme.palette.background.dark}, ${theme.palette.background.default})`,
  },
}));

interface AllProjectsProps {
  data: Project[];
}

const AllProjects = (props: AllProjectsProps): ReactElement => {
  const classes = useStyles();
  const { data } = props;
  const { workRef } = useContext(RefContext);

  return (
    <>
      <div className={classes.topGradient} />

      <div className={classes.container}>
        <GradientBackground />

        <Parallax className={classes.projectTitle} y={[-30, 150]} x={[-10, 10]}>
          <Typography variant="h1" ref={workRef}>
            Work
          </Typography>
        </Parallax>

        <div className={classes.projectsContainer}>
          {data.map((project, index) => (
            <React.Fragment key={uid(project)}>
              <ProjectContainer data={project} isEven={index % 2 === 0} />

              {index < data.length - 1 && <VerticalBar />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className={classes.bottomGradient} />
    </>
  );
};

const AllProjectsWithData = (): ReactElement => (
  <StaticQuery
    query={graphql`
      query Projects {
        allContentfulProjects {
          edges {
            node {
              title
              jobTitle
              url
              coverImage {
                fluid(maxWidth: 1920) {
                  ...GatsbyContentfulFluid_withWebp
                }
              }
              description {
                childMarkdownRemark {
                  html
                }
              }
            }
          }
        }
      }
    `}
    render={data => <AllProjects data={data.allContentfulProjects.edges.map(item => item.node)} />}
  />
);

export default AllProjectsWithData;
