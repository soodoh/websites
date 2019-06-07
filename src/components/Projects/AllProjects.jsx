import React from 'react';
import PropTypes from 'prop-types';
import { uid } from 'react-uid';
import { StaticQuery, graphql } from 'gatsby';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Project from './ProjectContainer';
import VerticalBar from '../common/VerticalBar';

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
    top: 0,
    left: '8vw',
    color: theme.palette.secondary.light,
    zIndex: 1,

    [theme.breakpoints.down('xs')]: {
      left: theme.spacing(2),
    },
  },
  projectsContainer: {
    paddingTop: theme.spacing(11),
  },
}));

const AllProjects = (props) => {
  const classes = useStyles();
  const { data } = props;

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

AllProjects.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.object,
  ).isRequired,
};

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
