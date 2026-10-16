// Test-only Mapbox GL double. Live rendering is checked separately with the real SDK.
(() => {
  class Bounds { extend() { return this } }
  class Map {
    constructor(options) { this.options = options; this.element = document.getElementById(options.container); this.element.dataset.testid = 'mapbox-map-canvas'; this.element.textContent = 'Mapbox test map'; this.element.style.height = '280px'; this.element.style.background = '#eae7ff'; this.sources = {}; this.layers = {}; }
    on(event, callback) { if (event === 'load') setTimeout(callback, 10); if (event === 'click') this.element.onclick = () => callback({ lngLat: { lat: this.options.center[1] + 0.001, lng: this.options.center[0] + 0.001 } }); }
    addControl() {} fitBounds() {} remove() {}
    addSource(id, source) { this.sources[id] = { ...source, setData(data) { this.data = data } }; }
    getSource(id) { return this.sources[id]; } removeSource(id) { delete this.sources[id]; }
    addLayer(layer) { this.layers[layer.id] = layer; if (layer.id === 'gomate-route') this.element.dataset.route = 'shown'; }
    getLayer(id) { return this.layers[id]; } removeLayer(id) { delete this.layers[id]; if (id === 'gomate-route') delete this.element.dataset.route; }
  }
  class Marker { setLngLat(point) { this.point = point; return this } addTo() { return this } on() {} remove() {} getLngLat() { return { lng: this.point[0], lat: this.point[1] } } }
  window.mapboxgl = { Map, Marker, LngLatBounds: Bounds, NavigationControl: class {} };
})();
