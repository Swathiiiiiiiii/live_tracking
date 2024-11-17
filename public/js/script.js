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
const paths = {}; // To store paths between users

// Handle receiving location data from other users
socket.on("receive-location", (data) => {
    console.log(`Received location: ${data.id}, ${data.latitude}, ${data.longitude}`); // Debugging

    const { id, latitude, longitude } = data;

    // Check if the marker exists, if so move it
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]); // Move the marker
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map); // Add a new marker
    }

    // Draw the path between the current user and the one being updated
    Object.keys(markers).forEach((userId) => {
        if (userId !== id && markers[userId] && markers[id]) {
            const pathId = [id, userId].sort().join('-'); // Unique path ID
            if (!paths[pathId]) {
                paths[pathId] = L.polyline([markers[userId].getLatLng(), markers[id].getLatLng()], {
                    color: 'blue', // Color for path line
                    weight: 3,
                }).addTo(map);
            } else {
                paths[pathId].setLatLngs([markers[userId].getLatLng(), markers[id].getLatLng()]);
            }
        }
    });

    // Optional: Recenter the map based on the new location of the current user
    map.setView([latitude, longitude], 14);
});

// Handle a user disconnecting and remove their marker and paths
socket.on("user-disconnected", (id) => {
    console.log(`User disconnected: ${id}`); // Debugging
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id]; // Clean up marker
    }

    // Remove paths related to the disconnected user
    Object.keys(paths).forEach((pathId) => {
        if (pathId.includes(id)) {
            map.removeLayer(paths[pathId]);
            delete paths[pathId];
        }
    });
});
