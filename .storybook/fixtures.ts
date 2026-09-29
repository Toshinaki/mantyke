/**
 * UI 测试用图片的规格，生成脚本（scripts/generate-test-fixtures.ts）与 story 共用这一份定义。
 * 修改规格后需要重新运行 `pnpm fixtures:generate`。
 */
export interface ImageFixture {
  /** 文件名（不含扩展名），同时作为画在图片上的标签 */
  name: string;
  width: number;
  height: number;
  /** 对角线渐变的起止颜色 */
  colors: [string, string];
}

export const FIXTURE_DIR = 'fixtures';

export function fixtureSrc(fixture: ImageFixture) {
  return `/${FIXTURE_DIR}/${fixture.name}.jpg`;
}

export const SPOTLIGHT_FIXTURES = {
  landscape: {
    name: 'landscape-3000x2000',
    width: 3000,
    height: 2000,
    colors: ['#4dabf7', '#7048e8'],
  },
  portrait: {
    name: 'portrait-2000x3000',
    width: 2000,
    height: 3000,
    colors: ['#63e6be', '#1c7ed6'],
  },
  small: { name: 'small-400x300', width: 400, height: 300, colors: ['#ffa94d', '#e64980'] },
  panorama: {
    name: 'panorama-6000x1000',
    width: 6000,
    height: 1000,
    colors: ['#69db7c', '#1098ad'],
  },
  tall: { name: 'tall-600x4000', width: 600, height: 4000, colors: ['#ff8787', '#f59f00'] },
  huge: { name: 'huge-8000x6000', width: 8000, height: 6000, colors: ['#748ffc', '#be4bdb'] },
} satisfies Record<string, ImageFixture>;

/** Masonry 用图的宽高（按顺序），覆盖横图、竖图、方图与极端比例 */
const MASONRY_SIZES: [number, number][] = [
  [1200, 800],
  [800, 1200],
  [1000, 1000],
  [1280, 720],
  [720, 1280],
  [1200, 900],
  [900, 1200],
  [1500, 500],
  [500, 1500],
  [1200, 800],
  [800, 1200],
  [1000, 1000],
];

/** 相邻图片的色相间隔，保证 12 张图片的颜色彼此可区分 */
const MASONRY_HUE_STEP = 30;
/** 渐变终点相对起点的色相偏移 */
const MASONRY_HUE_SHIFT = 40;

export const MASONRY_FIXTURES: ImageFixture[] = MASONRY_SIZES.map(([width, height], index) => {
  const hue = index * MASONRY_HUE_STEP;
  return {
    name: `masonry-${String(index + 1).padStart(2, '0')}-${width}x${height}`,
    width,
    height,
    colors: [`hsl(${hue}, 70%, 65%)`, `hsl(${hue + MASONRY_HUE_SHIFT}, 70%, 40%)`],
  };
});

export const ALL_FIXTURES: ImageFixture[] = [
  ...Object.values(SPOTLIGHT_FIXTURES),
  ...MASONRY_FIXTURES,
];
