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
  useProps,
  useStyles,
  type ActionIconProps,
  type ElementProps,
  type Factory,
  type ImageProps,
  type ModalProps,
  type StylesApiProps,
} from '@mantine/core';
import { useFullscreen } from '@mantine/hooks';
import classes from './spotlight-image.module.css';

export type SpotlightImageStylesNames = 'root';
export type SpotlightImageCssVariables = {};

export interface SpotlightImageProps
  extends Omit<ImageProps, 'onClick' | keyof StylesApiProps<SpotlightImageFactory>>,
    StylesApiProps<SpotlightImageFactory>,
    ElementProps<'img', keyof ImageProps | 'onClick'> {
  /** Image fit behavior when clicked to open spotlight, 'cover' by default */
  fit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';

  /** Zoom speed multiplier, 1.2 by default */
  zoomSpeed?: number;

  /** Maximum zoom level, 5 by default */
  maxZoom?: number;

  /** Minimum zoom level, 0.25 by default */
  minZoom?: number;

  /** Modal props for spotlight overlay */
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
};

export const SpotlightImage = factory<SpotlightImageFactory>((_props, ref) => {
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
    modalProps,
    ...others
  } = props;

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
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialZoom, setInitialZoom] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
  /**
   * Mirror the latest state values into a ref so that callbacks registered in
   * `useEffect` (wheel, keyboard) always read fresh values without needing those
   * values in the dependency array (which would cause listener churn).
   */
  const stateRef = useRef({ zoom: 1, initialZoom: 1, position: { x: 0, y: 0 } });
  stateRef.current = { zoom, initialZoom, position };
  // Destructure `ref` from `useFullscreen` so we can attach it to the
  // spotlight container instead of letting it default to `document.documentElement`.
  const { ref: fullscreenRef, toggle: toggleFullscreen, fullscreen } = useFullscreen();

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

  // ── Zoom helpers ───────────────────────────────────────────────────────────

  /**
   * Calculate the initial zoom level to fit image within viewport
   * Ensures large images are scaled down while small images aren't upscaled
   */
  const calculateInitialZoom = (img: HTMLImageElement) => {
    const padding = 80;
    const availableWidth = window.innerWidth - padding;
    const availableHeight = window.innerHeight - padding;
    const scaleX = availableWidth / img.naturalWidth;
    const scaleY = availableHeight / img.naturalHeight;
    // Use the smaller scale to ensure image fits entirely
    // Don't upscale images smaller than screen
    return Math.min(scaleX, scaleY, 1);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Prefer `currentTarget` over `target` — guaranteed to be the element the handler is on
    const img = e.currentTarget;
    const newInitialZoom = calculateInitialZoom(img);
    setInitialZoom(newInitialZoom);
    setZoom(newInitialZoom);
    setIsImageLoaded(true);
  };

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * zoomSpeed, maxZoom));
  }, [maxZoom, zoomSpeed]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev / zoomSpeed, minZoom);
      // Reset position when zooming back to fit-to-screen level
      if (newZoom <= stateRef.current.initialZoom) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, [zoomSpeed, minZoom]);

  const handleZoomReset = useCallback(() => {
    setZoom(stateRef.current.initialZoom);
    setPosition({ x: 0, y: 0 });
  }, []);

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
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    };

    spotlightNode.addEventListener('wheel', onWheel, { passive: false });
    return () => spotlightNode.removeEventListener('wheel', onWheel);
  }, [handleZoomIn, handleZoomOut, isOpen, spotlightNode]);

  // ── Open / Close ───────────────────────────────────────────────────────────

  const openSpotlight = () => {
    setIsOpen(true);
    setIsImageLoaded(false);
    setPosition({ x: 0, y: 0 });
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
    setZoom(1);
    setInitialZoom(1);
    setIsImageLoaded(false);
    setPosition({ x: 0, y: 0 });
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
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleZoomReset();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleZoomIn, handleZoomOut, handleZoomReset]);

  // ── Drag / Pan ─────────────────────────────────────────────────────────────

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
    const newX = x - drag.startX;
    const newY = y - drag.startY;
    drag.posX = newX;
    drag.posY = newY;
    // Update DOM directly for performance (#9)
    updateTransform(newX, newY, stateRef.current.zoom);
  };

  /** End drag — sync final position back to React state */
  const handlePointerUp = () => {
    const drag = dragRef.current;
    if (drag.isDragging) {
      drag.isDragging = false;
      // Sync final position to state
      setPosition({ x: drag.posX, y: drag.posY });
      setIsDragging(false);
    }
  };

  // Mouse events delegate to the pointer-agnostic helpers above
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePointerDown(e.clientX, e.clientY);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current.isDragging) {
      e.preventDefault();
      handlePointerMove(e.clientX, e.clientY);
    }
  };
  const handleMouseUp = () => handlePointerUp();

  // ── Touch events ───────────────────────────────────────────────────────────

  /**
   * Touch support — single-finger drag and two-finger pinch-to-zoom.
   * The CSS `.spotlight` class has `touch-action: none` to prevent the browser's
   * default touch gestures from interfering.
   */
  const getTouchDistance = (touches: React.TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
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
        const scale = newDist / prevDist;
        setZoom((prev) => Math.min(Math.max(prev * scale, minZoom), maxZoom));
      }
      touchRef.current.lastDistance = newDist;
    }
  };

  const handleTouchEnd = () => {
    handlePointerUp();
    touchRef.current.lastDistance = 0;
  };

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
        {...modalProps}
        opened={isOpen}
        onClose={handleClose}
        fullScreen
        withCloseButton={false}
        overlayProps={{
          opacity: 0.9,
          blur: 2,
          ...modalProps?.overlayProps,
        }}
        padding={0}
        classNames={{
          ...modalProps?.classNames,
          root: clsx(classes.modalRoot, modalProps?.classNames?.root),
          content: clsx(classes.modalContent, modalProps?.classNames?.content),
          body: clsx(classes.modalBody, modalProps?.classNames?.body),
        }}
      >
        <div
          ref={combinedSpotlightRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={clsx(classes.spotlight, {
            [classes.grab]: zoom > initialZoom && !isDragging,
            [classes.grabbing]: zoom > initialZoom && isDragging,
          })}
        >
          <Group className={clsx(classes.controls, classes.topControls)}>
            <ControlButton
              onClick={() => toggleFullscreen()}
              aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {fullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
            </ControlButton>
            <CloseButton
              size="lg"
              variant="filled"
              onClick={handleClose}
              aria-label="Close spotlight"
              className={classes.controlButton}
            />
          </Group>

          <Group className={`${classes.controls} ${classes.bottomControls}`}>
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
                [classes.noTransition]: isDragging,
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

const ControlButton = (props: ElementProps<'button', keyof ActionIconProps> & ActionIconProps) => (
  <ActionIcon
    size="lg"
    variant="filled"
    {...props}
    className={clsx(classes.controlButton, props.className)}
  />
);
