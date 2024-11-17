const socket = io();

// Check for geolocation support
if (navigator.geolocation) {
    // Watch the user's position and emit updates
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`Emitting location: ${latitude}, ${longitude}`); // Debugging
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

const map = L.map("map").setView([0, 0], 10);

// Load OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Sheryians Coding School",
}).addTo(map);

// Store markers for each user
const markers = {}; 

// Handle receiving location data from other users
socket.on("receive-location", (data) => {
    console.log(`Received location: ${data.id}, ${data.latitude}, ${data.longitude}`); // Debugging

    const { id, latitude, longitude } = data;

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]); // Move the marker
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map); // Add a new marker
    }

    // Optional: Recenter the map based on the new location of the current user
    map.setView([latitude, longitude], 14);
});

// Handle a user disconnecting and remove their marker
socket.on("user-disconnected", (id) => {
    console.log(`User disconnected: ${id}`); // Debugging
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id]; // Clean up marker
    }
});
 