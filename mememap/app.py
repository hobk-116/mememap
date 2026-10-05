"""Composition root. Services share configuration and storage, not HTTP state."""
from .auth import AuthService
from .database import Database
from .media import ImageStorage
from .migrations import migrate
from .moderation import ModerationService
from .pins import PinService
from .profiles import ProfileService
from .regions import Regions


class Application:
    def __init__(self, settings):
        self.settings = settings
        self.database = Database(settings.db_path)
        self.images = ImageStorage(settings)
        self.regions = Regions()
        self.auth = AuthService(self.database)
        self.profiles = ProfileService(self.database, self.images)
        self.pins = PinService(self.database, self.images, self.regions)
        self.moderation = ModerationService(self.database, self.images)

    def initialize(self):
        migrate(self.database, self.images)
