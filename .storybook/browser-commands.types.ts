/** 坐标均为测试 iframe 视口内的 CSS 像素，与 getBoundingClientRect 的结果一致 */
export type PointerAction =
  | { type: 'move'; x: number; y: number; steps?: number }
  | { type: 'down' }
  | { type: 'up' }
  | { type: 'wheel'; deltaY: number; deltaX?: number; modifiers?: WheelModifier[] };

export type WheelModifier = 'Control' | 'Meta' | 'Shift' | 'Alt';
