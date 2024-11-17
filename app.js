const express = require("express");
const app = express();
const http = require("http");
const socketio = require("socket.io");
const server = http.createServer(app);
const io = socketio(server);
const path = require("path");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public"))); 

// When a user connects to the server
io.on("connection", function (socket) {
    console.log("A user connected: ", socket.id);

    // Listen for location updates
    socket.on("send-location", function (data) {
        console.log("Location data received from", socket.id, data);
        // Broadcast the location data to all other connected clients
        io.emit("receive-location", { id: socket.id, ...data });
    });

    // Handle user disconnect
    socket.on("disconnect", function() {
        console.log("User disconnected: ", socket.id);
        io.emit("user-disconnected", socket.id); // Inform all users of the disconnection
    });
});

// Serve the index page
app.get("/", function (req, res) {
    res.render("index");
});

// Start the server
server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
