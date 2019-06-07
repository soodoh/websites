// eslint-disable-next-line import/no-extraneous-dependencies
const dotenv = require('dotenv');
const theme = require('./src/components/Layout/theme');

// Load environment variables from project
dotenv.config();
const spaceId = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_DELIVERY_TOKEN;

const siteUrl = 'https://pauldiloreto.com';

module.exports = {
  siteMetadata: {
    siteUrl,
  },
  plugins: [
    'gatsby-plugin-eslint',
    'gatsby-plugin-layout',
    'gatsby-plugin-remove-trailing-slashes',
    'gatsby-transformer-remark',
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-remove-serviceworker',
    // 'gatsby-plugin-offline',
    'gatsby-plugin-sitemap',
    // {
    //   resolve: 'gatsby-plugin-material-ui',
    // },
    {
      resolve: 'gatsby-plugin-google-analytics',
      options: {
        trackingId: 'UA-141361857-3',
        head: true,
        anonymize: true,
      },
    },
    {
      resolve: 'gatsby-plugin-robots-txt',
      options: {
        host: siteUrl,
        sitemap: `${siteUrl}/sitemap.xml`,
        policy: [{ userAgent: '*', allow: '/' }],
      },
    },
    {
      resolve: 'gatsby-plugin-react-svg',
      options: {
        rule: {
          include: /assets/,
        },
      },
    },
    {
      resolve: 'gatsby-source-contentful',
      options: { spaceId, accessToken },
    },
    {
      resolve: 'gatsby-plugin-web-font-loader',
      options: {
        google: {
          families: ['Fjalla One', 'Geo'],
        },
      },
    },
    {
      resolve: '@wapps/gatsby-plugin-material-ui',
      options: { theme },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'Paul DiLoreto Portfolio',
        short_name: 'PD Portfolio',
        start_url: '/',
        background_color: '#0E0827',
        theme_color: '#D7DFC2',
        // Enables "Add to Homescreen" prompt and disables browser UI (including back button)
        // see https://developers.google.com/web/fundamentals/web-app-manifest/#display
        display: 'standalone',
        icon: 'assets/favicon.png', // This path is relative to the root of the site.
      },
    },
  ],
};
