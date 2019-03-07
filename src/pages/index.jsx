import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { StaticQuery, graphql } from 'gatsby';
import { withStyles } from '@material-ui/core/styles';
import Metadata from '../components/common/Metadata';
import Banner from '../components/Banner';
import Projects from '../components/Projects/AllProjects';
import About from '../components/About';
import Footer from '../components/Layout/Footer';

const HomeCore = (props) => {
  const { classes, data } = props;

  return (
    <>
      <Metadata
        title="PD Portfolio"
        description="Paul DiLoreto is a Full Stack Software Engineer currently working at 20th Century Fox. View portfolio for more info."
      />

      <Helmet>
        <body className={classes.background} />
      </Helmet>

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

HomeCore.propTypes = {
  classes: PropTypes.shape({}).isRequired,
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

const styles = theme => ({
  background: {
    backgroundColor: theme.palette.primary.main,
  },
});

const Home = withStyles(styles)(HomeCore);

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
