// 赞助信息。sponsor.json、en.json 和 qr/ 下的图片都是从 Ishtar-Gate/.github 仓库的 sponsor/ 文件夹复制来的，
// 要改就先改那边，再重新复制到这里；不要只改这里。
import type { StaticImageData } from 'next/image';
import text from './en.json';
import alipayQr from './qr/alipay.png';
import githubSponsorsQr from './qr/github-sponsors.png';
import kofiQr from './qr/kofi.png';
import wechatQr from './qr/wechat.png';
import data from './sponsor.json';

type MethodId = keyof typeof text.methods;

export interface SponsorMethod {
  id: MethodId;
  name: string;
  /** 一句话说明，例如「Card and more, no sign-up needed」 */
  hint: string;
  /** 能在浏览器打开的链接；只能扫码的收款码没有 */
  url?: string;
  qr: StaticImageData;
}

// sponsor.json 里的 qr 是相对 sponsor/ 的路径，Next 需要静态 import 才能在加上 basePath 后找到图片，所以按 id 对应
const QR_IMAGES: Record<MethodId, StaticImageData> = {
  kofi: kofiQr,
  wechat: wechatQr,
  alipay: alipayQr,
  githubSponsors: githubSponsorsQr,
};

export const SPONSOR_METHODS: SponsorMethod[] = data.methods.map((method) => {
  const id = method.id as MethodId;
  return {
    id,
    name: text.methods[id].name,
    hint: text.methods[id].hint,
    url: 'url' in method ? method.url : undefined,
    qr: QR_IMAGES[id],
  };
});

export const SPONSOR_PUBLISHER = {
  intro: text.publisher.intro,
  authorSiteLabel: text.publisher.authorSite,
  authorSiteUrl: data.publisher.authorSite,
  githubLabel: text.publisher.github,
  githubUrl: data.publisher.github,
};

export const SPONSOR_METHODS_TITLE = text.methodsTitle;
