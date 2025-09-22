export interface PackageData {
  /** Package name as in npm */
  packageName: string;

  /** Description of the package, displayed below the title in documentation */
  packageDescription: string;

  /** Link to the documentation mdx file, used in "Edit this page button" */
  mdxFileUrl: string;

  /** Link to the repository on GitHub, used in header github icon and in "View source code button" */
  repositoryUrl: string;

  /** Link to the license file */
  licenseUrl?: string;

  /** Information about the author of the package */
  author: {
    /** Package author name, for example, `John Doe` */
    name: string;

    /** Author GitHub username, for example, `rtivital` */
    githubUsername: string;
  };
}

export const PACKAGE_DATA: PackageData = {
  packageName: '@mantyke/spotlight-image',
  packageDescription:
    'React component for displaying images with zoom, pan, and fullscreen capabilities.',
  mdxFileUrl:
    'https://github.com/rtivital/mantine-extension-template/blob/master/docs/pages/index.mdx',
  repositoryUrl:
    'https://github.com/Toshinaki/mantyke/blob/master/packages/spotlight-image/src/spotlight-image.tsx',
  licenseUrl: 'https://github.com/Toshinaki/mantyke/blob/master/LICENSE',
  author: {
    name: 'JM',
    githubUsername: 'Toshinaki',
  },
};
