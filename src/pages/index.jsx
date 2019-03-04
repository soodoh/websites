import React from 'react';
import PropTypes from 'prop-types';
import { StaticQuery, graphql } from 'gatsby';
import { withStyles } from '@material-ui/core/styles';
import Metadata from '../components/common/Metadata';
import Banner from '../components/Banner';

const HomeCore = (props) => {
  const { classes, data } = props;

  return (
    <React.Fragment>
      <Metadata
        title="PD Portfolio"
        description="Paul DiLoreto is a Full Stack Software Engineer currently working at 20th Century Fox. View portfolio for more info."
      />

      <div className={classes.container}>
        <Banner
          title={data.title}
          jobTitle={data.jobTitle}
          tagLine={data.tagLine}
        />
      </div>
    </React.Fragment>
  );
};

HomeCore.propTypes = {
  classes: PropTypes.shape({
    home: PropTypes.string,
    buttonGroup: PropTypes.string,
  }).isRequired,
  data: PropTypes.shape({
    title: PropTypes.string.isRequired,
    jobTitle: PropTypes.string.isRequired,
    tagLine: PropTypes.string.isRequired,
    description: PropTypes.object.isRequired,
    portrait: PropTypes.object.isRequired,
  }).isRequired,
};

const styles = theme => ({
  container: {
    padding: `${theme.spacing.unit * 6}px '10vw`,
    [theme.breakpoints.down('xs')]: {
      padding: `${theme.spacing.unit * 6}px ${theme.spacing.unit * 2}px`,
    },
  },
});

const Home = withStyles(styles)(HomeCore);

export default () => (
  <StaticQuery
    query={graphql`
      query Projects {
        contentfulAbout {
          title
          jobTitle
          tagLine
          description {
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
