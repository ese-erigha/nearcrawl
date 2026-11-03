class UnauthorizedError(Exception):
    def __init__(self) -> None:
        super().__init__("Unauthorized")


class NotFoundError(Exception):
    pass


class UnavailableError(Exception):
    def __init__(self) -> None:
        super().__init__("Inference service is unavailable")
