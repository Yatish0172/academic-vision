import hashlib
import hmac
import secrets
import time
from collections import defaultdict, deque
from threading import Lock


def password_hash(password):
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    return salt + ':' + digest


def password_matches(password, encoded):
    salt, expected = encoded.split(':')
    actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    return hmac.compare_digest(actual, expected)


def digest_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


class LoginLimiter:
    def __init__(self):
        self.entries = defaultdict(deque)
        self.lock = Lock()

    def allow(self, key):
        with self.lock:
            now = time.monotonic()
            for address in list(self.entries):
                bucket = self.entries[address]
                while bucket and bucket[0] < now - 60:
                    bucket.popleft()
                if not bucket:
                    del self.entries[address]
            bucket = self.entries[key]
            if len(bucket) >= 10:
                return False
            bucket.append(now)
            return True
