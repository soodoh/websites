import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ProjectThumbnail from './ProjectThumbnail';
import ArrowBack from '../../../assets/ArrowBack.svg';
import ArrowForward from '../../../assets/ArrowForward.svg';

const ProjectContainer = (props) => {
  const { classes, data, isEven } = props;

  return (
    <div
      className={classNames({
        [classes.container]: true,
        [classes.oddContainer]: !isEven,
      })}
    >
      <div
        className={classNames({
          [classes.description]: true,
          [classes.oddDescription]: !isEven,
        })}
      >
        <Typography variant="h5" color="primary" gutterBottom>
          {data.jobTitle}
        </Typography>

        <div
          className={classNames({
            [classes.markdownContent]: true,
            [classes.oddMarkdown]: !isEven,
          })}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: data.description.childMarkdownRemark.html }}
        />

        <Button
          variant="contained"
          className={classes.viewButton}
          component={({ children, ...others }) => (
            <a {...others}>
              {children}
            </a>
          )}
          href={data.url}
        >
          {!isEven && (
            <ArrowBack />
          )}
          View Site
          {isEven && (
            <ArrowForward />
          )}
        </Button>
      </div>

      <div
        className={classNames({
          [classes.thumbnail]: true,
          [classes.oddThumbnail]: !isEven,
        })}
      >
        <ProjectThumbnail data={data} />
      </div>
    </div>
  );
};

ProjectContainer.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  data: PropTypes.shape({
    coverImage: PropTypes.object.isRequired,
    description: PropTypes.object.isRequired,
    jobTitle: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    url: PropTypes.string,
  }).isRequired,
  isEven: PropTypes.bool.isRequired,
};

const styles = theme => ({
  container: {
    padding: `${theme.spacing.unit * 2}px 0`,
    display: 'grid',
    gridTemplateColumns: '40% 60%',
    gridColumnGap: theme.spacing.unit * 6,

    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: 'auto',
      gridColumnGap: 0,
    },
  },
  oddContainer: {
    gridTemplateColumns: '60% 40%',
  },
  viewButton: {
    marginTop: theme.spacing.unit * 2,
    backgroundColor: theme.palette.primary.contrastText,

    '& svg': {
      margin: `0 ${theme.spacing.unit * 2}px`,
    },
    '& line, path': {
      stroke: theme.palette.primary.main,
      fill: theme.palette.primary.main,
    },
  },
  description: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  oddDescription: {
    alignItems: 'flex-start',
    gridColumn: 2,
  },
  thumbnail: {
    display: 'flex',
    justifyContent: 'center',
  },
  oddThumbnail: {
    gridColumn: 1,
  },
  markdownContent: {
    ...theme.typography.body1,
    color: theme.palette.primary.main,
    margin: 0,
    paddingBottom: 0,

    '& h1, h2, h3': {
      ...theme.typography.h5,
      marginBottom: 0,
      color: theme.palette.primary.contrastText,
    },
    '& ul': {
      margin: 0,
      padding: 0,
      listStyleType: 'none',
    },
    '& li': {
      padding: 0,
      margin: `${theme.spacing.unit * 2}px 0`,
      lineHeight: '1rem',
      textAlign: 'right',
    },
  },
  oddMarkdown: {
    '& li': {
      textAlign: 'left',
    },
  },
});

export default withStyles(styles)(ProjectContainer);
