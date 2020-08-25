import React, { ReactElement } from 'react';
import Helmet from 'react-helmet';
import { StaticQuery, graphql } from 'gatsby';
import { makeStyles } from '@material-ui/styles';
import Metadata from '../components/common/Metadata';
import Banner from '../components/Banner';
import Projects from '../components/Projects/AllProjects';
import About from '../components/About';
import { Markdown, Image } from '../types';

const useStyles = makeStyles(theme => ({
  container: {
    position: 'relative',
    width: '100%',
    overflowX: 'hidden',
  },
  background: {
    backgroundColor: theme.palette.background.default,
  },
}));

interface HomeProps {
  data: {
    title: string;
    jobTitle: string;
    tagLine: string;
    contact: string;
    description: Markdown;
    skills: Markdown;
    portrait: Image;
  };
}

const Home = (props: HomeProps): ReactElement => {
  const classes = useStyles();
  const { data } = props;

  return (
    <div className={classes.container}>
      <Metadata title="PD Portfolio" description={data.tagLine} />

      <Helmet>
        <body className={classes.background} />
      </Helmet>

      <Banner title={data.title} jobTitle={data.jobTitle} tagLine={data.tagLine} contact={data.contact} />

      <Projects />

      <About
        aboutContent={data.description.childMarkdownRemark.html}
        skillsContent={data.skills.childMarkdownRemark.html}
        portrait={data.portrait}
      />
    </div>
  );
};

const HomeWithData = (): ReactElement => (
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
    render={data => <Home data={data.contentfulAbout} />}
  />
);

export default HomeWithData;
