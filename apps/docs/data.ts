export interface PackageData {
  /** Page path segment, for example `spotlight-image` for `/spotlight-image` */
  slug: string;

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

const REPOSITORY_ROOT = 'https://github.com/Toshinaki/mantyke';

export const REPOSITORY_URL = REPOSITORY_ROOT;

const AUTHOR = { name: 'JM', githubUsername: 'Toshinaki' };
const LICENSE_URL = `${REPOSITORY_ROOT}/blob/master/LICENSE`;

export const SPOTLIGHT_IMAGE_DATA: PackageData = {
  slug: 'spotlight-image',
  packageName: '@mantyke/spotlight-image',
  packageDescription:
    'React component for displaying images with zoom, pan, and fullscreen capabilities.',
  mdxFileUrl: `${REPOSITORY_ROOT}/blob/master/apps/docs/spotlight-image.mdx`,
  repositoryUrl: `${REPOSITORY_ROOT}/blob/master/packages/spotlight-image/src/spotlight-image.tsx`,
  licenseUrl: LICENSE_URL,
  author: AUTHOR,
};

export const MASONRY_DATA: PackageData = {
  slug: 'masonry',
  packageName: '@mantyke/masonry',
  packageDescription:
    'Masonry, justified columns and justified rows layouts with responsive columns and gap.',
  mdxFileUrl: `${REPOSITORY_ROOT}/blob/master/apps/docs/masonry.mdx`,
  repositoryUrl: `${REPOSITORY_ROOT}/blob/master/packages/masonry/src/masonry.tsx`,
  licenseUrl: LICENSE_URL,
  author: AUTHOR,
};

export const PACKAGES: PackageData[] = [SPOTLIGHT_IMAGE_DATA, MASONRY_DATA];
