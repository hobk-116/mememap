"""Map display and posting scopes; community polygons will extend this boundary."""
from dataclasses import dataclass
import math


@dataclass(frozen=True)
class Bounds:
    south: float
    north: float
    west: float
    east: float

    def contains(self, lat, lng):
        return math.isfinite(lat) and math.isfinite(lng) and self.south <= lat <= self.north and self.west <= lng <= self.east

    def values(self):
        return self.south, self.north, self.west, self.east

    def leaflet(self):
        return [[self.south, self.west], [self.north, self.east]]


class Regions:
    def __init__(self):
        self.posting = Bounds(20.09, 21.89, 104.83, 106.76)
        self.leaderboards = {"hanoi": Bounds(20.65, 21.30, 105.50, 106.20)}

    def map_config(self):
        return {"bounds": self.posting.leaflet(), "center": [20.9893, 105.7953],
                "zoom": 18, "min_zoom": 11, "max_zoom": 19,
                "style": "https://tiles.openfreemap.org/styles/liberty",
                "tiles": {"url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                          "attribution": '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}}
