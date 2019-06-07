import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { StaticQuery, graphql } from 'gatsby';
import { makeStyles } from '@material-ui/styles';
import Metadata from '../components/common/Metadata';
import Banner from '../components/Banner';
import Projects from '../components/Projects/AllProjects';
import About from '../components/About';

const useStyles = makeStyles(theme => ({
  container: {
    position: 'relative',
    width: '100vw',
    overflowX: 'hidden',
  },
  background: {
    backgroundColor: theme.palette.background.default,
  },
}));

const Home = (props) => {
  const classes = useStyles();
  const { data } = props;

  return (
    <div className={classes.container}>
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
        contact={data.contact}
      />

      <Projects />

      <About
        aboutContent={data.description.childMarkdownRemark.html}
        skillsContent={data.skills.childMarkdownRemark.html}
        contact={data.contact}
        portrait={data.portrait}
      />
    </div>
  );
};

Home.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string.isRequired,
    jobTitle: PropTypes.string.isRequired,
    tagLine: PropTypes.string.isRequired,
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
          contact
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
