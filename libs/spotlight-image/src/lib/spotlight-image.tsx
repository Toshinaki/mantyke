import { useState } from 'react';
import { useFullscreen } from '@mantine/hooks';
import clsx from 'clsx';
import {
  Image,
  Modal,
  CloseButton,
  ActionIcon,
  Group,
  type ImageProps,
  type ElementProps,
  type ModalProps,
  type ActionIconProps,
} from '@mantine/core';
import {
  TbMinimize,
  TbMaximize,
  TbZoomOut,
  TbZoomReset,
  TbZoomIn,
} from 'react-icons/tb';
import styles from './spotlight-image.module.css';

// Configuration constants for the spotlight component
const ZOOM_SPEED = 1.2; // Multiplicative zoom factor (1.2x per step)
const MAX_ZOOM = 5; // Maximum allowed zoom level
const MIN_ZOOM = 0.25; // Minimum allowed zoom level
const FIT: SpotlightImageProps['fit'] = 'cover'; // Default image fit behavior
const MODAL_OVERLAY_OPACITY = 0.9; // Modal background opacity
const MODAL_OVERLAY_BLUR = 2; // Modal background blur in pixels

interface SpotlightImageProps
  extends ElementProps<'img', keyof ImageProps>,
    ImageProps {
  fit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';
  zoomSpeed?: number;
  maxZoom?: number;
  minZoom?: number;
  modalProps?: Omit<
    ModalProps,
    'opened' | 'onClose' | 'fullScreen' | 'withCloseButton'
  >;
}

export function SpotlightImage(props: SpotlightImageProps) {
  // 2. Props are merged with defaults. Passed props will override the defaults.
  const {
    src,
    alt,
    width,
    height,
    radius,
    fit = FIT,
    zoomSpeed = ZOOM_SPEED,
    maxZoom = MAX_ZOOM,
    minZoom = MIN_ZOOM,
    modalProps,
    ...rest
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialZoom, setInitialZoom] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { toggle: toggleFullscreen, fullscreen } = useFullscreen();
  const handleFullscreenToggle = () => toggleFullscreen();

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
    const img = e.target as HTMLImageElement;
    const newInitialZoom = calculateInitialZoom(img);
    setInitialZoom(newInitialZoom);
    setZoom(newInitialZoom);
    setIsImageLoaded(true);
  };

  const handleZoomIn = () =>
    setZoom((prev) => Math.min(prev * zoomSpeed, maxZoom));
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / zoomSpeed, minZoom);
    setZoom(newZoom);
    // Reset position when zooming back to fit-to-screen level
    if (newZoom <= initialZoom) setPosition({ x: 0, y: 0 });
  };
  const handleZoomReset = () => {
    setZoom(initialZoom);
    setPosition({ x: 0, y: 0 });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsImageLoaded(false);
    setPosition({ x: 0, y: 0 });
  };
  const handleClose = () => {
    setIsOpen(false);
    setZoom(1);
    setInitialZoom(1);
    setIsImageLoaded(false);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  /**
   * Start drag interaction
   * Only allow dragging when zoomed beyond fit-to-screen level
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (zoom > initialZoom) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };
  /**
   * Handle drag movement
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > initialZoom) {
      e.preventDefault();
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <>
      {/* Original clickable image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        radius={radius}
        fit={fit}
        onClick={handleOpen}
        {...rest}
        className={clsx(styles.originalImage, rest.className)}
      />

      {/* Fullscreen modal with spotlight functionality */}
      <Modal
        {...modalProps}
        opened={isOpen}
        onClose={handleClose}
        fullScreen
        withCloseButton={false}
        overlayProps={{
          opacity: MODAL_OVERLAY_OPACITY,
          blur: MODAL_OVERLAY_BLUR,
          ...modalProps?.overlayProps,
        }}
        padding={0}
        classNames={{
          ...modalProps?.classNames,
          root: clsx(
            styles.modalRoot,
            modalProps?.className,
            modalProps?.classNames?.root
          ),
          content: clsx(styles.modalContent, modalProps?.classNames?.content),
          body: clsx(styles.modalBody, modalProps?.classNames?.body),
        }}
      >
        <div
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={clsx(
            styles.spotlight,
            // Show appropriate cursor based on zoom and drag state
            zoom > initialZoom && (isDragging ? styles.grabbing : styles.grab)
          )}
        >
          {/* Top right controls: fullscreen toggle and close */}
          <Group className={clsx(styles.controls, styles.topControls)}>
            <ControlButton onClick={handleFullscreenToggle}>
              {fullscreen ? <TbMinimize size={18} /> : <TbMaximize size={18} />}
            </ControlButton>

            <CloseButton
              size="lg"
              variant="filled"
              onClick={handleClose}
              className={styles.controlButton}
            />
          </Group>

          {/* Bottom center controls: zoom controls */}
          <Group className={clsx(styles.controls, styles.bottomControls)}>
            <ControlButton onClick={handleZoomOut}>
              <TbZoomOut size={18} />
            </ControlButton>

            <ControlButton onClick={handleZoomReset}>
              <TbZoomReset size={18} />
            </ControlButton>

            <ControlButton onClick={handleZoomIn}>
              <TbZoomIn size={18} />
            </ControlButton>
          </Group>

          {/* Image container */}
          <div className={styles.imageWrapper}>
            <Image
              src={src}
              alt={alt}
              fit="contain"
              onLoad={handleImageLoad}
              className={clsx(styles.modalImage, {
                [styles.noTransition]: isDragging,
                [styles.imageLoaded]: isImageLoaded,
              })}
              style={{
                // Apply zoom and pan transforms
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
}

const ControlButton = (
  props: ElementProps<'button', keyof ActionIconProps> & ActionIconProps
) => (
  <ActionIcon
    {...props}
    size="lg"
    variant="filled"
    className={styles.controlButton}
  />
);
