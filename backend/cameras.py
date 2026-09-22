"""Bounded RTSP snapshots for configured institutional cameras."""
import cv2


def capture_snapshot(url: str) -> bytes:
    capture = cv2.VideoCapture()
    try:
        opened = capture.open(url, cv2.CAP_FFMPEG, [cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000,
                                                   cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000])
        if not opened:
            raise RuntimeError('Camera connection failed. Check the configured stream and network.')
        ok, frame = capture.read()
        if not ok or frame is None:
            raise RuntimeError('The camera did not return a frame within the timeout.')
        height, width = frame.shape[:2]
        if max(height, width) > 1920:
            scale = 1920 / max(height, width)
            frame = cv2.resize(frame, (int(width * scale), int(height * scale)))
        ok, encoded = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if not ok:
            raise RuntimeError('The camera frame could not be encoded.')
        return encoded.tobytes()
    except cv2.error as exc:
        raise RuntimeError('Camera capture failed. Verify FFmpeg support and the stream configuration.') from exc
    finally:
        capture.release()
