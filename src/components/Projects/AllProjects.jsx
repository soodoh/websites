import React from 'react';
import PropTypes from 'prop-types';
import { StaticQuery, graphql } from 'gatsby';

const AllProjects = (props) => {
  const { data } = props;
  console.log(data);

  return (
    <div>
      Hello World!
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
