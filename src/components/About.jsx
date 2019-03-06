import React from 'react';
import PropTypes from 'prop-types';
import Img from 'gatsby-image';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const About = (props) => {
  const {
    classes, aboutContent, skillsContent, portrait,
  } = props;

  return (
    <div className={classes.container}>
      <Typography variant="h1" align="center">
        About Me
      </Typography>

      <Typography variant="h5">
        About
      </Typography>
      <div
        className={classes.markdownContent}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: aboutContent }}
      />

      <Typography variant="h5">
        Skills
      </Typography>
      <div
        className={classes.markdownContent}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: skillsContent }}
      />

      <Img fluid={portrait} />
    </div>
  );
};

About.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  portrait: PropTypes.shape({
    fluid: PropTypes.object.isRequired,
  }).isRequired,
  aboutContent: PropTypes.string.isRequired,
  skillsContent: PropTypes.string.isRequired,
};

const styles = theme => ({
  container: {
    marginTop: theme.spacing.unit * 6,
  },
});

export default withStyles(styles)(About);
