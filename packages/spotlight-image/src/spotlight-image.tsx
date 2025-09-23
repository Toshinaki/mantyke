import React, { useState } from 'react';
import {
  IconMaximize,
  IconMinimize,
  IconZoomIn,
  IconZoomOut,
  IconZoomReset,
} from '@tabler/icons-react';
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
    vars,
    src,
    alt,
    zoomSpeed = 1.2,
    maxZoom = 5,
    minZoom = 0.5,
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
    vars,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialZoom, setInitialZoom] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { toggle: toggleFullscreen, fullscreen } = useFullscreen();

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

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * zoomSpeed, maxZoom));
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / zoomSpeed, minZoom);
    setZoom(newZoom);
    // Reset position when zooming back to fit-to-screen level
    if (newZoom <= initialZoom) {
      setPosition({ x: 0, y: 0 });
    }
  };
  const handleZoomReset = () => {
    setZoom(initialZoom);
    setPosition({ x: 0, y: 0 });
  };

  const handleOpen: React.MouseEventHandler<HTMLImageElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();

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
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
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
      <Image
        ref={ref}
        src={src}
        alt={alt}
        onClick={handleOpen}
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
          root: classes.modalRoot,
          content: classes.modalContent,
          body: classes.modalBody,
        }}
      >
        <div
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`${classes.spotlight} ${
            zoom > initialZoom ? (isDragging ? classes.grabbing : classes.grab) : ''
          }`}
        >
          <Group className={`${classes.controls} ${classes.topControls}`}>
            <ControlButton onClick={() => toggleFullscreen()}>
              {fullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
            </ControlButton>
            <CloseButton
              size="lg"
              variant="filled"
              onClick={handleClose}
              className={classes.controlButton}
            />
          </Group>

          <Group className={`${classes.controls} ${classes.bottomControls}`}>
            <ControlButton onClick={handleZoomOut}>
              <IconZoomOut size={18} />
            </ControlButton>
            <ControlButton onClick={handleZoomReset}>
              <IconZoomReset size={18} />
            </ControlButton>
            <ControlButton onClick={handleZoomIn}>
              <IconZoomIn size={18} />
            </ControlButton>
          </Group>

          <div className={classes.imageWrapper}>
            <Image
              src={src}
              alt={alt}
              fit="contain"
              onLoad={handleImageLoad}
              className={`${classes.modalImage} ${
                isDragging ? classes.noTransition : ''
              } ${isImageLoaded ? classes.imageLoaded : ''}`}
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
  <ActionIcon {...props} size="lg" variant="filled" className={classes.controlButton} />
);
