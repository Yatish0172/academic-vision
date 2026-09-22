"""Local YuNet landmark detection and SFace embeddings; no cloud image uploads."""
import hashlib
import io
from PIL import Image, UnidentifiedImageError
import os
from pathlib import Path
from threading import RLock

import cv2
import numpy as np
from cryptography.fernet import Fernet

MODEL_NAME = 'OpenCV SFace 2021DEC'


class VisionEngine:
    def __init__(self, models_dir, data_dir):
        self.models_dir = Path(models_dir)
        self.lock = RLock()
        self.detector = self.recognizer = None
        key = os.getenv('FACE_ATTENDANCE_KEY')
        key_path = Path(data_dir) / '.embedding.key'
        if key:
            self.cipher = Fernet(key.encode())
        else:
            if not key_path.exists():
                # Exclusive creation prevents concurrent processes replacing the encryption key.
                try:
                    with key_path.open('xb') as file:
                        file.write(Fernet.generate_key())
                    key_path.chmod(0o600)
                except FileExistsError:
                    pass
            self.cipher = Fernet(key_path.read_bytes())

    def status(self):
        missing = [name for name in ('face_detection_yunet.onnx', 'face_recognition_sface.onnx')
                   if not (self.models_dir / name).is_file()]
        return {'model': MODEL_NAME, 'ready': not missing, 'missing': missing,
                'liveness': 'Not implemented; attendance requires operator confirmation'}

    def _load(self):
        if self.detector is None:
            missing = self.status()['missing']
            if missing:
                raise RuntimeError('Missing vision models: ' + ', '.join(missing))
            self.detector = cv2.FaceDetectorYN.create(str(self.models_dir / 'face_detection_yunet.onnx'), '', (640, 480), 0.9)
            self.recognizer = cv2.FaceRecognizerSF.create(str(self.models_dir / 'face_recognition_sface.onnx'), '')

    def extract(self, payload, min_size=70):
        if not payload or len(payload) > 8 * 1024 * 1024:
            raise ValueError('Each image must be nonempty and at most 8 MB.')
        if not (payload.startswith(b'\xff\xd8\xff') or payload.startswith(b'\x89PNG\r\n\x1a\n')):
            raise ValueError('Upload a JPEG or PNG image.')
        try:
            with Image.open(io.BytesIO(payload)) as source:
                if source.width * source.height > 16_000_000:
                    raise ValueError('Image exceeds 16 megapixels.')
                source.verify()
        except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError) as exc:
            raise ValueError('The image is invalid or too large.') from exc
        frame = cv2.imdecode(np.frombuffer(payload, np.uint8), cv2.IMREAD_COLOR)
        if frame is None or frame.shape[0] * frame.shape[1] > 16_000_000:
            raise ValueError('Invalid image or image exceeds 16 megapixels.')
        height, width = frame.shape[:2]
        with self.lock:
            self._load()
            self.detector.setInputSize((width, height))
            _, faces = self.detector.detect(frame)
            result = []
            for face in ([] if faces is None else faces):
                x, y, w, h = [int(v) for v in face[:4]]
                item = {'box': [x, y, w, h], 'confidence': float(face[-1]), 'embedding': None, 'reason': ''}
                if min(w, h) < min_size:
                    item['reason'] = 'Face is too small; move closer.'
                else:
                    crop = self.recognizer.alignCrop(frame, face)
                    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
                    if cv2.Laplacian(gray, cv2.CV_64F).var() < 35:
                        item['reason'] = 'Image is too blurred.'
                    elif not 35 <= float(gray.mean()) <= 225:
                        item['reason'] = 'Improve face lighting.'
                    else:
                        vector = self.recognizer.feature(crop).flatten().astype(np.float32)
                        item['embedding'] = vector / max(float(np.linalg.norm(vector)), 1e-9)
                result.append(item)
        return width, height, result

    def enroll(self, payloads, min_size):
        if not 3 <= len(payloads) <= 10:
            raise ValueError('Provide 3–10 distinct, clear, single-face photos.')
        if len({hashlib.sha256(p).digest() for p in payloads}) != len(payloads):
            raise ValueError('Duplicate enrollment photos are not allowed.')
        vectors = []
        for index, payload in enumerate(payloads):
            _, _, faces = self.extract(payload, min_size)
            if len(faces) != 1 or faces[0]['embedding'] is None:
                raise ValueError(f'Photo {index + 1}: exactly one clear, well-lit face is required.')
            vectors.append(faces[0]['embedding'])
        if any(float(np.dot(vectors[0], vector)) < 0.45 for vector in vectors[1:]):
            raise ValueError('Enrollment photos do not consistently match the same person.')
        average = np.mean(vectors, axis=0).astype(np.float32)
        average /= max(float(np.linalg.norm(average)), 1e-9)
        return self.cipher.encrypt(average.tobytes())

    def decrypt(self, encrypted):
        return np.frombuffer(self.cipher.decrypt(encrypted), dtype=np.float32)
