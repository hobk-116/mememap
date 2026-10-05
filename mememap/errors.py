"""Errors understood by every application adapter."""
class RequestError(ValueError):
    def __init__(self, code, status=400, details=None):
        super().__init__(code)
        self.code, self.status = code, status
        self.payload = {"error": code, **(details or {})}

    @classmethod
    def from_payload(cls, status, payload):
        return cls(payload["error"], status, {k: v for k, v in payload.items() if k != "error"})


def require(condition, code, status=400):
    if not condition:
        raise RequestError(code, status)


def require_user(user):
    require(user is not None, "authentication_required", 401)
    return user


def require_admin(user):
    require_user(user)
    require(user["is_admin"], "admin_required", 403)
    return user
