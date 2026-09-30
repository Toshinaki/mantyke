import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconMaximize,
  IconMinimize,
  IconZoomIn,
  IconZoomOut,
  IconZoomReset,
} from '@tabler/icons-react';
import clsx from 'clsx';
import {
  ActionIcon,
  CloseButton,
  factory,
  Group,
  Image,
  Modal,
  Tooltip,
  useProps,
  useStyles,
  type ActionIconProps,
  type ElementProps,
  type Factory,
  type ImageProps,
  type ModalProps,
  type StylesApiProps,
} from '@mantine/core';
import { useFullscreenElement, useTimeout } from '@mantine/hooks';
import classes from './spotlight-image.module.css';

export type SpotlightImageStylesNames = 'root';
export type SpotlightImageCssVariables = {};

export interface SpotlightImageProps
  extends
    Omit<ImageProps, 'onClick' | keyof StylesApiProps<SpotlightImageFactory>>,
    StylesApiProps<SpotlightImageFactory>,
    ElementProps<'img', keyof ImageProps | 'onClick'> {
  /** Image fit behavior when clicked to open spotlight, 'cover' by default */
  fit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';

  /** Zoom speed multiplier, 1.2 by default */
  zoomSpeed?: number;

  /** Maximum zoom level, 5 by default */
  maxZoom?: number;

  /** Minimum zoom level, 0.25 by default. If the fit-to-screen zoom is lower, it is used as the minimum instead */
  minZoom?: number;

  /** Keep the zoomed image covering the viewport while dragging, so it cannot be dragged out of view, `false` by default */
  keepImageInView?: boolean;

  /** Modal props for spotlight overlay. Set `closeOnClickOutside` to close the spotlight when the empty area around the image is clicked (`false` by default) */
  modalProps?: Omit<ModalProps, 'opened' | 'onClose' | 'fullScreen' | 'withCloseButton'>;
}

export type SpotlightImageFactory = Factory<{
  props: SpotlightImageProps;
  ref: HTMLImageElement;
  stylesNames: SpotlightImageStylesNames;
  vars: SpotlightImageCssVariables;
}>;

const defaultProps: Partial<SpotlightImageProps> = {
  fit: 'cover',
  zoomSpeed: 1.2,
  maxZoom: 5,
  minZoom: 0.25,
  keepImageInView: false,
};

interface Point {
  x: number;
  y: number;
}

interface ViewState {
  zoom: number;
  initialZoom: number;
  position: Point;
}

const INITIAL_VIEW: ViewState = { zoom: 1, initialZoom: 1, position: { x: 0, y: 0 } };

/** 适配屏幕时图片四周保留的留白（两侧合计） */
const FIT_PADDING = 80;
/** 鼠标滚轮滚动一格的 deltaY（像素模式）。滚动一格等同于点击一次放大或缩小按钮 */
const WHEEL_NOTCH_PX = 100;
/** Firefox 以「行」为单位上报滚轮，一格为 3 行 */
const WHEEL_LINE_PX = WHEEL_NOTCH_PX / 3;
/**
 * 触控板捏合（浏览器以带 ctrlKey 的 wheel 事件上报）的灵敏度。
 * 缩放倍数为 e^(-deltaY × 灵敏度)，使缩放幅度与手指动作成比例。
 */
const PINCH_SENSITIVITY = 0.01;
/** 按下与点击之间移动超过该距离时视为拖动，不触发「点击空白处关闭」 */
const CLICK_MOVE_TOLERANCE = 5;
/** 不支持全屏时，点击按钮后提示的显示时长 */
const FULLSCREEN_HINT_DURATION = 2000;
const FULLSCREEN_UNSUPPORTED_LABEL = 'Fullscreen is not supported on this device';

/**
 * Calculate the initial zoom level to fit image within viewport
 * Ensures large images are scaled down while small images aren't upscaled
 */
function calculateInitialZoom(img: HTMLImageElement) {
  const availableWidth = window.innerWidth - FIT_PADDING;
  const availableHeight = window.innerHeight - FIT_PADDING;
  const scaleX = availableWidth / img.naturalWidth;
  const scaleY = availableHeight / img.naturalHeight;
  // Use the smaller scale to ensure image fits entirely
  // Don't upscale images smaller than screen
  return Math.min(scaleX, scaleY, 1);
}

/** 把不同 deltaMode 的滚轮距离统一换算为像素 */
function getWheelDeltaPx(e: WheelEvent) {
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return e.deltaY * WHEEL_LINE_PX;
  }
  if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return e.deltaY * window.innerHeight;
  }
  return e.deltaY;
}

/**
 * 把使用者通过 `modalProps.classNames` 传入的 class 与组件自身的 class 合并。
 * Mantine 的 `classNames` 既可以是对象，也可以是根据主题与 props 返回对象的函数，两种形式都要支持。
 */
function mergeModalClassNames(userClassNames: ModalProps['classNames']): ModalProps['classNames'] {
  return (theme, props, ctx) => {
    const resolved =
      typeof userClassNames === 'function'
        ? userClassNames(theme, props, ctx)
        : (userClassNames ?? {});
    return {
      ...resolved,
      root: clsx(classes.modalRoot, resolved.root),
      content: clsx(classes.modalContent, resolved.content),
      body: clsx(classes.modalBody, resolved.body),
    };
  };
}

/** iPhone Safari 等浏览器不支持对普通元素调用全屏 API */
function isFullscreenSupported() {
  if (typeof document === 'undefined') {
    return false;
  }
  const doc = document as Document & { webkitFullscreenEnabled?: boolean };
  return Boolean(doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled);
}

export const SpotlightImage = factory<SpotlightImageFactory>((_props) => {
  const props = useProps('SpotlightImage', defaultProps, _props);
  const {
    classNames,
    className,
    style,
    styles,
    unstyled,
    attributes,
    vars,
    src,
    alt,
    fit,
    zoomSpeed = 1.2,
    maxZoom = 5,
    minZoom = 0.25,
    keepImageInView = false,
    modalProps,
    ref,
    ...others
  } = props;
  const { closeOnClickOutside = false, ...restModalProps } = modalProps ?? {};

  const getStyles = useStyles<SpotlightImageFactory>({
    name: 'SpotlightImage',
    classes,
    props,
    className,
    style,
    classNames,
    styles,
    unstyled,
    attributes,
    vars,
  });

  // ── State ──────────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(INITIAL_VIEW.zoom);
  const [position, setPosition] = useState(INITIAL_VIEW.position);
  const [initialZoom, setInitialZoom] = useState(INITIAL_VIEW.initialZoom);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  /** 手指是否在查看区域内，触摸期间关闭位移过渡，让图片直接跟随手指 */
  const [isTouching, setIsTouching] = useState(false);
  const [isFullscreenHintOpen, setIsFullscreenHintOpen] = useState(false);
  const { start: startFullscreenHintTimer, clear: clearFullscreenHintTimer } = useTimeout(
    () => setIsFullscreenHintOpen(false),
    FULLSCREEN_HINT_DURATION
  );

  // ── Refs ───────────────────────────────────────────────────────────────────

  /**
   * The spotlight container node is stored in state (not a ref) so that
   * when the Modal finishes its enter transition and the div mounts, the state update
   * triggers a re-render and the wheel `useEffect` re-runs with the actual DOM node.
   *
   * A plain `useRef` would silently update `.current` without triggering the effect,
   * causing the wheel listener to never be attached.
   */
  const [spotlightNode, setSpotlightNode] = useState<HTMLDivElement | null>(null);
  /**
   * Drag state stored in a ref to avoid triggering a React re-render on every
   * mousemove frame. DOM transform is updated directly during drag; state is synced on
   * pointer-up so React stays consistent.
   */
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });
  /**
   * Ref to the modal <img> element for direct DOM transform updates during drag.
   */
  const imageTransformRef = useRef<HTMLImageElement>(null);
  /** Tracks distance between two touch points for pinch-to-zoom */
  const touchRef = useRef({ lastDistance: 0 });
  /** 最近一次按下的位置，用于区分点击与拖动 */
  const pressRef = useRef<Point | null>(null);
  /**
   * 交互过程中的缩放与位置以 ref 为准：滚轮、拖动等高频操作直接修改 ref 和 DOM，
   * 再通过 `setView` 或防抖同步到 React state。不在每次渲染时用 state 覆盖 ref，
   * 否则防抖期间发生的重新渲染会把 ref 改回旧值。
   */
  const stateRef = useRef<ViewState>({ ...INITIAL_VIEW });
  /** Timer ID for debounced sync of stateRef back to React state after zoom */
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Destructure `ref` from `useFullscreenElement` so we can attach it to the
  // spotlight container instead of letting it default to `document.documentElement`.
  const { ref: fullscreenRef, toggle: toggleFullscreen, fullscreen } = useFullscreenElement();

  /**
   * Callback ref for the spotlight container div. Serves three purposes:
   * 1. Stores the node in state (`setSpotlightNode`) to trigger the wheel effect
   * 2. Passes the node to `fullscreenRef` for the Fullscreen API
   *
   * `fullscreenRef` is stable (wrapped in `useCallback([], [])` inside Mantine),
   * so this callback is also stable and won't cause unnecessary ref churn.
   */
  const combinedSpotlightRef = useCallback(
    (node: HTMLDivElement | null) => {
      setSpotlightNode(node);
      fullscreenRef(node);
    },
    [fullscreenRef]
  );

  // ── View state helpers ─────────────────────────────────────────────────────

  const cancelPendingSync = useCallback(() => {
    if (syncTimerRef.current !== null) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }, []);

  /** 立即更新 ref 与 React state，并取消尚未执行的防抖同步 */
  const setView = useCallback(
    (next: Partial<ViewState>) => {
      Object.assign(stateRef.current, next);
      cancelPendingSync();
      setZoom(stateRef.current.zoom);
      setInitialZoom(stateRef.current.initialZoom);
      setPosition(stateRef.current.position);
    },
    [cancelPendingSync]
  );

  /**
   * Flush stateRef values back to React state after zoom interaction settles.
   * Debounced: resets the timer on every call so rapid wheel/pinch events
   * produce only a single React re-render once the user pauses.
   */
  const syncStateFromRef = useCallback(() => {
    cancelPendingSync();
    syncTimerRef.current = setTimeout(() => {
      syncTimerRef.current = null;
      const { zoom: z, position: pos } = stateRef.current;
      setZoom(z);
      setPosition({ x: pos.x, y: pos.y });
    }, 150);
  }, [cancelPendingSync]);

  /**
   * Directly mutate the image's CSS transform during drag for smooth
   * movement, bypassing React's reconciliation. State is synced on pointer-up.
   */
  const updateTransform = (x: number, y: number, z: number) => {
    const el = imageTransformRef.current;
    if (el) {
      el.style.transform = `scale(${z}) translate(${x / z}px, ${y / z}px)`;
    }
  };

  /**
   * 开启 `keepImageInView` 时限制平移范围：图片比可视区域大的方向上，边缘不能移进可视区域；
   * 图片比可视区域小的方向上保持居中。
   */
  const constrainPosition = (pos: Point, z: number): Point => {
    const img = imageTransformRef.current;
    if (!keepImageInView || !img || !spotlightNode) {
      return pos;
    }
    const bounds = spotlightNode.getBoundingClientRect();
    const maxX = Math.max(0, (img.naturalWidth * z - bounds.width) / 2);
    const maxY = Math.max(0, (img.naturalHeight * z - bounds.height) / 2);
    return {
      x: Math.min(Math.max(pos.x, -maxX), maxX),
      y: Math.min(Math.max(pos.y, -maxY), maxY),
    };
  };

  /** 视口坐标相对于查看区域中心的偏移 */
  const getOffsetFromCenter = (clientX: number, clientY: number): Point => {
    if (!spotlightNode) {
      return { x: 0, y: 0 };
    }
    const bounds = spotlightNode.getBoundingClientRect();
    return {
      x: clientX - (bounds.left + bounds.width / 2),
      y: clientY - (bounds.top + bounds.height / 2),
    };
  };

  // ── Zoom helpers ───────────────────────────────────────────────────────────

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Prefer `currentTarget` over `target` — guaranteed to be the element the handler is on
    const fitZoom = calculateInitialZoom(e.currentTarget);
    setView({ initialZoom: fitZoom, zoom: fitZoom, position: { x: 0, y: 0 } });
    setIsImageLoaded(true);
  };

  /**
   * 缩小的下限。图片打开时的适配缩放可能已经低于 `minZoom`（大图、窄屏），
   * 此时以适配缩放为下限，保证缩小操作不会反而把图片放大。
   */
  const getMinZoom = () => Math.min(minZoom, stateRef.current.initialZoom);

  /**
   * 缩放到 targetZoom，并保持 anchor（相对查看区域中心的偏移）下方的图片内容不动。
   * 不传 anchor 时以查看区域中心为缩放中心。缩小到适配大小或更小时图片回到中间。
   */
  const zoomTo = (targetZoom: number, anchor: Point = { x: 0, y: 0 }) => {
    const { zoom: currentZoom, initialZoom: fitZoom, position: pos } = stateRef.current;
    const newZoom = Math.min(Math.max(targetZoom, getMinZoom()), maxZoom);
    const ratio = newZoom / currentZoom;
    const nextPosition =
      newZoom <= fitZoom
        ? { x: 0, y: 0 }
        : {
            x: anchor.x * (1 - ratio) + pos.x * ratio,
            y: anchor.y * (1 - ratio) + pos.y * ratio,
          };
    stateRef.current.zoom = newZoom;
    stateRef.current.position = constrainPosition(nextPosition, newZoom);
    updateTransform(stateRef.current.position.x, stateRef.current.position.y, newZoom);
    syncStateFromRef();
  };

  const handleZoomIn = () => zoomTo(stateRef.current.zoom * zoomSpeed);
  const handleZoomOut = () => zoomTo(stateRef.current.zoom / zoomSpeed);
  const handleZoomReset = () => zoomTo(stateRef.current.initialZoom);

  /**
   * 事件监听只在打开或关闭时注册一次，回调通过 ref 取到最新的处理函数，
   * 避免因处理函数每次渲染都重新创建而反复解绑与绑定监听。
   */
  const handlersRef = useRef({ zoomTo, handleZoomIn, handleZoomOut, handleZoomReset });
  handlersRef.current = { zoomTo, handleZoomIn, handleZoomOut, handleZoomReset };

  // ── Wheel handling ─────────────────────────────────────────────────────────

  /**
   * React registers wheel listeners as passive by default (React 17+),
   * which means `e.preventDefault()` inside a React `onWheel` handler is silently
   * ignored and the page behind the modal will still scroll.
   *
   * We attach a native listener with `{ passive: false }` instead.
   */
  useEffect(() => {
    if (!spotlightNode || !isOpen) {
      return;
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const deltaPx = getWheelDeltaPx(e);
      // 缩放倍数与滚动距离成比例：鼠标滚轮一格对应一次 zoomSpeed，触控板捏合按手指动作缩放
      const factor = e.ctrlKey
        ? Math.exp(-deltaPx * PINCH_SENSITIVITY)
        : zoomSpeed ** (-deltaPx / WHEEL_NOTCH_PX);
      const bounds = spotlightNode.getBoundingClientRect();
      handlersRef.current.zoomTo(stateRef.current.zoom * factor, {
        x: e.clientX - (bounds.left + bounds.width / 2),
        y: e.clientY - (bounds.top + bounds.height / 2),
      });
    };

    spotlightNode.addEventListener('wheel', onWheel, { passive: false });
    return () => spotlightNode.removeEventListener('wheel', onWheel);
  }, [isOpen, spotlightNode, zoomSpeed]);

  // ── Native gesture blocking ────────────────────────────────────────────────

  /**
   * 阻止浏览器自身的双指缩放与滚动。否则 iOS Safari 会在组件缩放图片的同时缩放整个页面，
   * 触点坐标随页面缩放变化，两者相互干扰，图片高速抖动。
   * React 的触摸事件监听是 passive 的，无法 preventDefault，这里注册原生监听；
   * gesturestart / gesturechange 是 WebKit 专有的双指手势事件。
   */
  useEffect(() => {
    if (!spotlightNode || !isOpen) {
      return;
    }

    const preventNativeGesture = (e: Event) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };
    const nativeGestureEvents = ['touchmove', 'gesturestart', 'gesturechange'];

    nativeGestureEvents.forEach((type) =>
      spotlightNode.addEventListener(type, preventNativeGesture, { passive: false })
    );
    return () =>
      nativeGestureEvents.forEach((type) =>
        spotlightNode.removeEventListener(type, preventNativeGesture)
      );
  }, [isOpen, spotlightNode]);

  // ── Resize handling ────────────────────────────────────────────────────────

  /**
   * 窗口尺寸变化（包括进入或退出全屏、旋转手机）时重新计算适配缩放。
   * 未放大时图片跟随重新适配；已放大时保留当前缩放，只更新下限与重置目标。
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onResize = () => {
      const img = imageTransformRef.current;
      if (!img || !img.naturalWidth) {
        return;
      }
      const fitZoom = calculateInitialZoom(img);
      const isZoomedIn = stateRef.current.zoom > stateRef.current.initialZoom;
      setView(
        isZoomedIn
          ? { initialZoom: fitZoom }
          : { initialZoom: fitZoom, zoom: fitZoom, position: { x: 0, y: 0 } }
      );
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, setView]);

  // ── Open / Close ───────────────────────────────────────────────────────────

  const openSpotlight = () => {
    setIsOpen(true);
    setIsImageLoaded(false);
    setView({ position: { x: 0, y: 0 } });
  };

  /** Click handler for the thumbnail image */
  const handleClickOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openSpotlight();
  };

  /**
   * Keyboard handler for the thumbnail image.
   * The thumbnail carries `role="button"` + `tabIndex={0}`, so Enter / Space
   * should behave identically to a click.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      openSpotlight();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setView({ ...INITIAL_VIEW, position: { x: 0, y: 0 } });
    setIsImageLoaded(false);
  };

  // ── Modal keyboard shortcuts ───────────────────────────────────────────────

  /**
   * Keyboard zoom while the modal is open:
   *   +/=  → zoom in
   *   -    → zoom out
   *   0    → reset zoom
   *
   * Modifier keys (Ctrl / Meta / Alt) are excluded to avoid intercepting
   * browser shortcuts like Ctrl+- (browser zoom) or Cmd+0 (browser reset).
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (e.key === '+' || e.key === '=') {
        handlersRef.current.handleZoomIn();
      } else if (e.key === '-') {
        handlersRef.current.handleZoomOut();
      } else if (e.key === '0') {
        handlersRef.current.handleZoomReset();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // ── Drag / Pan ─────────────────────────────────────────────────────────────

  /**
   * Start drag interaction
   * Only allow dragging when zoomed beyond fit-to-screen level
   */
  const handlePointerDown = (x: number, y: number) => {
    const { zoom: z, initialZoom: iz, position: pos } = stateRef.current;
    if (z > iz) {
      dragRef.current = {
        isDragging: true,
        startX: x - pos.x,
        startY: y - pos.y,
        posX: pos.x,
        posY: pos.y,
      };
      setIsDragging(true);
    }
  };

  /** Move drag — update DOM directly, no `setState` */
  const handlePointerMove = (x: number, y: number) => {
    const drag = dragRef.current;
    if (!drag.isDragging) {
      return;
    }
    const next = constrainPosition(
      { x: x - drag.startX, y: y - drag.startY },
      stateRef.current.zoom
    );
    drag.posX = next.x;
    drag.posY = next.y;
    // Update DOM directly for performance (#9)
    updateTransform(next.x, next.y, stateRef.current.zoom);
  };

  /** End drag — sync final position back to React state */
  const handlePointerUp = () => {
    const drag = dragRef.current;
    if (drag.isDragging) {
      drag.isDragging = false;
      // Sync final position to state
      setView({ position: { x: drag.posX, y: drag.posY } });
      setIsDragging(false);
    }
  };

  /** 在控制按钮上按下时不开始拖动，否则点击按钮时的轻微移动会带动图片 */
  const isFromControls = (target: EventTarget) =>
    target instanceof Element && target.closest(`.${classes.controls}`) !== null;

  // Mouse events delegate to the pointer-agnostic helpers above
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFromControls(e.target)) {
      return;
    }
    e.preventDefault();
    pressRef.current = { x: e.clientX, y: e.clientY };
    handlePointerDown(e.clientX, e.clientY);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current.isDragging) {
      e.preventDefault();
      handlePointerMove(e.clientX, e.clientY);
    }
  };
  const handleMouseUp = () => handlePointerUp();

  /** 开启 `closeOnClickOutside` 时，点击图片以外的区域关闭查看器；拖动后松开不算点击 */
  const handleBackdropClick = (e: React.MouseEvent) => {
    const press = pressRef.current;
    const img = imageTransformRef.current;
    if (!closeOnClickOutside || !press || !img || isFromControls(e.target)) {
      return;
    }
    const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y);
    const bounds = img.getBoundingClientRect();
    const isOnImage =
      e.clientX >= bounds.left &&
      e.clientX <= bounds.right &&
      e.clientY >= bounds.top &&
      e.clientY <= bounds.bottom;
    if (moved <= CLICK_MOVE_TOLERANCE && !isOnImage) {
      handleClose();
    }
  };

  // ── Touch events ───────────────────────────────────────────────────────────

  /**
   * Touch support — single-finger drag and two-finger pinch-to-zoom.
   * The CSS `.spotlight` class has `touch-action: none`, and native listeners above
   * block the browser's own pinch zoom, so the two do not interfere.
   */
  const getTouchDistance = (touches: React.TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isFromControls(e.target)) {
      return;
    }
    setIsTouching(true);
    if (e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      // Begin pinch — record initial distance between fingers
      touchRef.current.lastDistance = getTouchDistance(e.touches);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragRef.current.isDragging) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      // Pinch zoom — scale proportional to finger distance change
      const newDist = getTouchDistance(e.touches);
      const prevDist = touchRef.current.lastDistance;
      if (prevDist > 0) {
        const [a, b] = [e.touches[0], e.touches[1]];
        // 以两指中点为缩放中心
        const anchor = getOffsetFromCenter(
          (a.clientX + b.clientX) / 2,
          (a.clientY + b.clientY) / 2
        );
        zoomTo(stateRef.current.zoom * (newDist / prevDist), anchor);
      }
      touchRef.current.lastDistance = newDist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handlePointerUp();
    touchRef.current.lastDistance = 0;
    if (e.touches.length === 0) {
      setIsTouching(false);
    }
  };

  // ── Fullscreen ─────────────────────────────────────────────────────────────

  const handleUnsupportedFullscreenClick = () => {
    clearFullscreenHintTimer();
    setIsFullscreenHintOpen(true);
    startFullscreenHintTimer();
  };

  const fullscreenButton = isFullscreenSupported() ? (
    <ControlButton
      onClick={() => toggleFullscreen()}
      aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {fullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
    </ControlButton>
  ) : (
    <Tooltip label={FULLSCREEN_UNSUPPORTED_LABEL} opened={isFullscreenHintOpen} position="bottom">
      <ControlButton
        data-disabled
        aria-disabled
        onClick={handleUnsupportedFullscreenClick}
        aria-label="Enter fullscreen"
      >
        <IconMaximize size={18} />
      </ControlButton>
    </Tooltip>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Image
        ref={ref}
        src={src}
        alt={alt}
        fit={fit}
        onClick={handleClickOpen}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        {...others}
        {...getStyles('root')}
      />

      <Modal
        {...restModalProps}
        opened={isOpen}
        onClose={handleClose}
        fullScreen
        withCloseButton={false}
        overlayProps={{
          opacity: 0.9,
          blur: 2,
          ...restModalProps.overlayProps,
        }}
        padding={0}
        classNames={mergeModalClassNames(restModalProps.classNames)}
      >
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- 点击空白处关闭只是鼠标与触屏的快捷方式，键盘用户通过 Esc 或关闭按钮关闭查看器 */}
        <div
          ref={combinedSpotlightRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleBackdropClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className={clsx(classes.spotlight, {
            [classes.grab]: zoom > initialZoom && !isDragging,
            [classes.grabbing]: zoom > initialZoom && isDragging,
            [classes.touching]: isTouching,
          })}
        >
          <Group className={clsx(classes.controls, classes.topControls)}>
            {fullscreenButton}
            <CloseButton
              size="lg"
              variant="filled"
              onClick={handleClose}
              aria-label="Close spotlight"
              className={classes.controlButton}
            />
          </Group>

          <Group className={clsx(classes.controls, classes.bottomControls)}>
            <ControlButton onClick={handleZoomOut} aria-label="Zoom out">
              <IconZoomOut size={18} />
            </ControlButton>
            <ControlButton onClick={handleZoomReset} aria-label="Reset zoom">
              <IconZoomReset size={18} />
            </ControlButton>
            <ControlButton onClick={handleZoomIn} aria-label="Zoom in">
              <IconZoomIn size={18} />
            </ControlButton>
          </Group>

          <div className={classes.imageWrapper}>
            <Image
              ref={imageTransformRef}
              src={src}
              alt={alt}
              fit="contain"
              onLoad={handleImageLoad}
              className={clsx(classes.modalImage, {
                [classes.imageLoaded]: isImageLoaded,
              })}
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${
                  position.y / zoom
                }px)`,
              }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
});

SpotlightImage.displayName = 'SpotlightImage';
SpotlightImage.classes = classes;

type ControlButtonProps = ElementProps<'button', keyof ActionIconProps> & ActionIconProps;

// 需要转发 ref：不支持全屏时按钮被 Tooltip 包裹，Tooltip 依赖子元素的 ref 定位
const ControlButton = React.forwardRef<HTMLButtonElement, ControlButtonProps>((props, ref) => (
  <ActionIcon
    ref={ref}
    size="lg"
    variant="filled"
    {...props}
    className={clsx(classes.controlButton, props.className)}
  />
));

ControlButton.displayName = 'ControlButton';
