document.addEventListener("DOMContentLoaded", () => {
    const maskName = document.getElementById("maskName");
    const changeMaskButton = document.getElementById("changeMask");
    const toggleExperimentalModeButton = document.getElementById("toggleExperimentalMode");
    const video = document.getElementById("video");
    const mediaDevices = navigator.mediaDevices;

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    let model;

    let selectedMask = 0;
    let isExperimentalModeEnabled = false;

    const masks = [
        {
            name: "Emoji",
            src: "img/masks/surprised_emoji.png",
            sizeOffsetX: 80,
            sizeOffsetY: 160,
            posOffsetX: 40,
            posOffsetY: 95,
        },
        {
            name: "Batman",
            src: "img/masks/batman.png",
            sizeOffsetX: 80,
            sizeOffsetY: 150,
            posOffsetX: 40,
            posOffsetY: 150,
        },
        {
            name: "Martin",
            src: "img/masks/martin.png",
            sizeOffsetX: 350,
            sizeOffsetY: 150,
            posOffsetX: 175,
            posOffsetY: 100,
        },
        {
            name: "Brodi",
            src: "img/masks/brodi.png",
            sizeOffsetX: 350,
            sizeOffsetY: 200,
            posOffsetX: 175,
            posOffsetY: 120,
        },
    ];

    const setUpVideo = () => {
        mediaDevices
            .getUserMedia({
                video: true,
                audio: false,
            })
            .then((stream) => {
                video.srcObject = stream;
            })
            .catch(alert);
    }

    const detectFaces = async () => {
        const faces = await model.estimateFaces(video, false);
        if (isExperimentalModeEnabled) {
            experimentalMask(faces);
        } else {
            mask(faces);
        }
    }


    const mask = (faces) => {
        let image = new Image();
        image.src = masks[selectedMask].src;
        image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            faces.forEach((face) => {
                let faceWidth = face.bottomRight[0] - face.topLeft[0];
                let faceHeight = face.bottomRight[1] - face.topLeft[1];
                ctx.drawImage(
                    image,
                    face.topLeft[0] - masks[selectedMask].posOffsetX,
                    face.topLeft[1] - masks[selectedMask].posOffsetY,
                    faceWidth + masks[selectedMask].sizeOffsetX,
                    faceHeight + masks[selectedMask].sizeOffsetY
                );
            });
        }
    }

    const experimentalMask = (faces) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        faces.forEach((face) => {
            let faceX = face.topLeft[0] + ((face.bottomRight[0] - face.topLeft[0]) / 2);
            let faceY = face.topLeft[1] + ((face.bottomRight[1] - face.topLeft[1]) / 2);
            drawCircle(faceX, faceY, 120, 0, Math.PI * 2, false, "yellow");
            face.landmarks.forEach((landmark, i) => {
                switch(i) {
                    case 0:
                        // left eye
                        drawCircle(landmark[0], landmark[1], 30, 0, Math.PI * 2, false, "white");
                        drawCircle(landmark[0], landmark[1], 20, 0, Math.PI * 2, false, "black");
                        break;
                    case 1:
                        // right eye
                        drawCircle(landmark[0], landmark[1], 30, 0, Math.PI * 2, false, "white");
                        drawCircle(landmark[0], landmark[1], 20, 0, Math.PI * 2, false, "black");
                        break;
                    case 2:
                        // nose
                        drawCircle(landmark[0], landmark[1] - 20, 20, 0, Math.PI * 2, false, "red");
                        break;
                    case 3:
                        // mouth
                        drawCircle(landmark[0], landmark[1] - 20, 70, 0, Math.PI, false, "black");
                        break;
                    case 4:
                        // left ear
                        break;
                    case 5:
                        // right ear
                        break;
                }
            });
        });
    }

    const drawCircle = (x, y, radius, startAngle, endAngle, counterclockwise, color) => {
        ctx.beginPath();
        ctx.arc(x, y , radius, startAngle, endAngle, counterclockwise);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    video.addEventListener("loadedmetadata", async () => {
        video.play();
        model = await blazeface.load();
        try {
            while (true) {
                await detectFaces();
            }
        } catch (e) {
            console.log(e);
        }
    });

    changeMaskButton.addEventListener("click", () => {
        if (selectedMask < masks.length - 1) {
            selectedMask++;
        } else {
            selectedMask = 0;
        }
        maskName.innerText = masks[selectedMask].name;
    });

    toggleExperimentalModeButton.addEventListener("click", () => {
        if (isExperimentalModeEnabled) {
            maskName.innerText = masks[selectedMask].name;
            changeMaskButton.removeAttribute("disabled");
        } else {
            maskName.innerText = "Experimental Mode";
            changeMaskButton.setAttribute("disabled", "false");
        }
        isExperimentalModeEnabled = !isExperimentalModeEnabled;
    });

    setUpVideo();
    maskName.innerText = masks[selectedMask].name;
});

