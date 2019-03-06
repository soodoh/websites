import React from 'react';
import PropTypes from 'prop-types';
import { StaticQuery, graphql } from 'gatsby';
import Metadata from '../components/common/Metadata';
import Banner from '../components/Banner';
import Projects from '../components/Projects/AllProjects';
import About from '../components/About';
import Footer from '../components/Layout/Footer';

const Home = (props) => {
  const { data } = props;

  return (
    <>
      <Metadata
        title="PD Portfolio"
        description="Paul DiLoreto is a Full Stack Software Engineer currently working at 20th Century Fox. View portfolio for more info."
      />

      <Banner
        title={data.title}
        jobTitle={data.jobTitle}
        tagLine={data.tagLine}
      />

      <Projects />

      <About
        aboutContent={data.description.childMarkdownRemark.html}
        skillsContent={data.skills.childMarkdownRemark.html}
        contact={data.contact}
        portrait={data.portrait}
      />

      <Footer />
    </>
  );
};

Home.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string.isRequired,
    jobTitle: PropTypes.string.isRequired,
    tagLine: PropTypes.string.isRequired,
    contact: PropTypes.string.isRequired,
    description: PropTypes.object.isRequired,
    skills: PropTypes.object.isRequired,
    portrait: PropTypes.object.isRequired,
  }).isRequired,
};

export default () => (
  <StaticQuery
    query={graphql`
      query HomePage {
        contentfulAbout {
          title
          jobTitle
          tagLine
          description {
            childMarkdownRemark {
              html
            }
          }
          skills {
            childMarkdownRemark {
              html
            }
          }
          portrait {
            fluid(maxWidth: 1920) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
        }
      }
    `}
    render={data => (
      <Home data={data.contentfulAbout} />
    )}
  />
);
