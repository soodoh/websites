import React from 'react';
import PropTypes from 'prop-types';
import { uid } from 'react-uid';
import { StaticQuery, graphql } from 'gatsby';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Project from './ProjectContainer';
import VerticalBar from '../common/VerticalBar';

const AllProjectsCore = (props) => {
  const { classes, data } = props;

  return (
    <div className={classes.container}>
      <Typography
        variant="h1"
        className={classes.projectTitle}
      >
        Work
      </Typography>

      <div className={classes.projectsContainer}>
        {data.map((project, index) => (
          <React.Fragment key={uid(project)}>
            <Project
              data={project}
              isEven={index % 2 === 0}
            />

            {index < data.length - 1 && (
              <VerticalBar />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

AllProjectsCore.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  data: PropTypes.arrayOf(
    PropTypes.object,
  ).isRequired,
};

const styles = theme => ({
  container: {
    position: 'relative',
    backgroundColor: theme.palette.background.light,
    padding: '0 10vw',

    [theme.breakpoints.down('xs')]: {
      padding: `0 ${theme.spacing.unit * 2}px`,
    },
  },
  projectTitle: {
    position: 'absolute',
    top: 0,
    left: '8vw',
    color: theme.palette.secondary.light,
    zIndex: 1,

    [theme.breakpoints.down('xs')]: {
      left: theme.spacing.unit * 2,
    },
  },
  projectsContainer: {
    paddingTop: theme.spacing.unit * 11,
  },
});

const AllProjects = withStyles(styles)(AllProjectsCore);

export default () => (
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
    render={data => (
      <AllProjects data={data.allContentfulProjects.edges.map(item => item.node)} />
    )}
  />
);
