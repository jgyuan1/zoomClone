const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
});

const myVideo = document.createElement("video");
// mute ourselves
myVideo.muted = true;

const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      // other peer call you, you answer the call by sending your own stream
      call.answer(stream);
      // call will give you the other peer's stream
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
      console.log("User connected" + userId);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    //close the media call with peer of userId
    peers[userId].close();
  }
  console.log("user logged out:" + userId);
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
  console.log("User is joining Room:" + ROOM_ID);
});
// socket.emit('join-room', ROOM_ID, 10)
// socket.on("user-connected", (userId) => {
//   console.log("User connected" + userId);
// });

function connectToNewUser(userId, stream) {
  // call the other peer with your stream
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}
