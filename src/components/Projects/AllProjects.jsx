import React from 'react';
import PropTypes from 'prop-types';
import { uid } from 'react-uid';
import { StaticQuery, graphql } from 'gatsby';
import { withStyles } from '@material-ui/core/styles';
import Project from './ProjectContainer';
import VerticalBar from '../common/VerticalBar';

const AllProjectsCore = (props) => {
  const { classes, data } = props;

  return (
    <div className={classes.container}>
      {data.map((project, index) => (
        <>
          <Project
            key={uid(project)}
            data={project}
            isEven={index % 2 === 0}
          />

          {index < data.length - 1 && (
            <VerticalBar />
          )}
        </>
      ))}
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
    backgroundColor: theme.palette.background.light,
    padding: '0 10vw',

    [theme.breakpoints.down('xs')]: {
      padding: `0 ${theme.spacing.unit * 2}px`,
    },
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
