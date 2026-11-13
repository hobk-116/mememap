/* Keep browser behavior tests independent of public map data; use the real MapLibre engine. */
async function mockMapStyle(surface) {
  await surface.route('https://tiles.openfreemap.org/**', route => route.fulfill({json: {
    version: 8, sources: {}, layers: [{id: 'background', type: 'background', paint: {'background-color': '#e7ebdf'}}],
  }}));
}
module.exports = {mockMapStyle};
