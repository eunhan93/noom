const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute')
const cameraBtn = document.getElementById('camera')
const camerasSelect = document.getElementById('cameras')
const call = document.getElementById('call')

call.hidden = true

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras(){
  try {
    const devices = await await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput')
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach(camera => {
      const option = document.createElement('option')
      option.value = camera.deviceId
      option.innerText = camera.label
      if(currentCamera.label === camera.label ){[
        option.selected = true
      ]}
      camerasSelect.appendChild(option)
    })
  } catch(e){
    console.log(e)
  }
}


async function getMedia(deviceId){
  const initialConstrains = {
    audio : true,
    video : {facingMode : "user"},
  }
  const cameraConstrains = {
    audio : true,
    video : {deviceId : {exact : deviceId}},

  }
  try{
    myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstrains : initialConstrains)

    myFace.srcObject = myStream;

    if(!deviceId){
      await getCameras();
    }
  } catch(e){
    console.log(e)
  }
}

// getMedia();


function handleMuteClick(){
  myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled)
  if(!muted){
    muteBtn.innerText = "Unmute"
    muted = true
  } else{
    muteBtn.innerText = "Mute"
    muted = false
  }
}
function handleCameraClick(){
  myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled)
  if(!cameraOff){
    cameraBtn.innerText = "Turn Camera On"
    cameraOff = true
  } else{
    cameraBtn.innerText = "Turn Camera Off"
    cameraOff = false
  }
}

async function handleCameraChange(){
  await getMedia(camerasSelect.value)
}


muteBtn.addEventListener("click", handleMuteClick)
cameraBtn.addEventListener("click", handleCameraClick)
camerasSelect.addEventListener('input', handleCameraChange)



// welcome form (join a room)

const welcome = document.getElementById('welcome')
const welcomeForm = welcome.querySelector('form')

async function initCall(){
  welcome.hidden = true
  call.hidden = false
  await getMedia()
  makeConnection();
}


async function handleWelcomeSubmit(event){
  event.preventDefault(event);
  const input = welcomeForm.querySelector('input');
  await initCall()
  socket.emit("join_room", input.value)
  roomName = input.value
  input.value = ''
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit)


// Socket code

socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer)
  socket.emit("offer", offer, roomName)
})

socket.on("offer", async (offer) => {
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer()
  myPeerConnection.setLocalDescription(answer)
  socket.emit("answer", answer, roomName)
})

socket.on("answer", answer => {
  myPeerConnection.setRemoteDescription(answer);
  
})


// RTC code 

function makeConnection(){
  myPeerConnection = new RTCPeerConnection();
  myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream))
}