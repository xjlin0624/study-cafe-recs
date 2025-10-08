mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    center: cafe.geometry.coordinates, // starting position [lng, lat]
    zoom: 8, // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

new mapboxgl.Marker()
    .setLngLat(cafe.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({offset: 20}).setHTML(
            `<h5>${cafe.title}</h5> <p class="text-muted">${cafe.location}</p>`
        )
    )
    .addTo(map)