document.addEventListener("DOMContentLoaded", () => {
    const maskName = document.getElementById("maskName");
    const changeMaskButton = document.getElementById("changeMask");
    const toggleStartStopButton = document.getElementById("toggleStartStop");
    const toggleExperimentalModeButton = document.getElementById("toggleExperimentalMode");
    const takeScreenshotButton = document.getElementById("takeScreenshot");
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");

    const mediaDevices = navigator.mediaDevices;
    const ctx = canvas.getContext("2d");

    let model;

    let isRunning = false;
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
        isExperimentalModeEnabled ? experimentalMask(faces) : mask(faces);
    }

    const mask = (faces) => {
        let image = new Image();
        image.src = masks[selectedMask].src;

        if (isRunning) image.onload = () => {
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
        };
    }

    const experimentalMask = (faces) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        faces.forEach((face) => {
            let faceWidth = face.bottomRight[0] - face.topLeft[0];
            let faceHeight = face.bottomRight[1] - face.topLeft[1];
            let faceX = face.topLeft[0] + (faceWidth / 2);
            let faceY = face.topLeft[1] + (faceHeight / 2);
            let leftEyeY = 0;
            let rightEyeY = 0;

            drawCircle(faceX, faceY, (faceWidth * 0.5), 0, Math.PI * 2, "yellow");

            face.landmarks.forEach((landmark, i) => {
                switch(i) {
                    case 0:
                        // left eye
                        drawCircle(landmark[0], landmark[1], (faceWidth * 0.15), 0, Math.PI * 2, "white");
                        drawCircle(landmark[0] + ((landmark[0] - faceX) * 0.5) + (faceWidth * 0.1), landmark[1] + ((landmark[1] - faceY)) + (faceWidth * 0.15), (faceWidth * 0.05), 0, Math.PI * 2, "black");
                        leftEyeY = landmark[1];
                        break;
                    case 1:
                        // right eye
                        drawCircle(landmark[0], landmark[1], (faceWidth * 0.15), 0, Math.PI * 2, "white");
                        drawCircle(landmark[0] + ((landmark[0] - faceX) * 0.5) - (faceWidth * 0.1), landmark[1] + ((landmark[1] - faceY)) + (faceWidth * 0.15), (faceWidth * 0.05), 0, Math.PI * 2, "black");
                        rightEyeY = landmark[1];
                        break;
                    case 2:
                        // nose
                        drawCircle(landmark[0], landmark[1] - (faceHeight * 0.1), (faceWidth * 0.05), 0, Math.PI * 2, "orange");
                        break;
                    case 3:
                        // mouth
                        drawCircle(landmark[0], landmark[1] - (faceHeight * 0.1), (faceWidth * 0.2), (rightEyeY - leftEyeY) * 0.02, (rightEyeY - leftEyeY) * 0.02 + Math.PI, "black");
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

    const drawCircle = (x, y, radius, startAngle, endAngle, color) => {
        ctx.beginPath();
        ctx.arc(x, y , radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    video.addEventListener("loadedmetadata", async () => {
        video.play();
        model = await blazeface.load();
    });

    toggleStartStopButton.addEventListener("click", async () => {
        isRunning = !isRunning;

        if (isRunning) {
            toggleStartStopButton.innerText = "Stop"
            maskName.innerText = isExperimentalModeEnabled ? "Experimental Mode" : masks[selectedMask].name;
        } else {
            toggleStartStopButton.innerText = "Start";
            maskName.innerText = "[Stopped]";
        }
        changeMaskButton.disabled = !isRunning || isExperimentalModeEnabled;
        toggleExperimentalModeButton.disabled = !isRunning;

        while (isRunning) {
            await detectFaces();
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    });

    changeMaskButton.addEventListener("click", () => {
        selectedMask < masks.length - 1 ? selectedMask++ : selectedMask = 0;
        maskName.innerText = masks[selectedMask].name;
    });

    toggleExperimentalModeButton.addEventListener("click", () => {
        isExperimentalModeEnabled = !isExperimentalModeEnabled;

        changeMaskButton.disabled = isExperimentalModeEnabled;
        maskName.innerText = isExperimentalModeEnabled ? "Experimental Mode" : masks[selectedMask].name;
    });

    takeScreenshotButton.addEventListener("click", async () => {
        const screenshotCanvas = document.createElement("canvas");
        screenshotCanvas.width = canvas.width;
        screenshotCanvas.height = canvas.height;

        const screenshotCtx = screenshotCanvas.getContext("2d");
        screenshotCtx.drawImage(video, 0, 0);
        screenshotCtx.drawImage(canvas, 0, 0);

        const img = new Image();
        const dataURL = screenshotCanvas.toDataURL("image/jpg");
        img.src = dataURL;

        const downloadLink = document.createElement("a");
        downloadLink.href = dataURL;
        downloadLink.download = "screenshot.jpg";
        downloadLink.click();
    });

    setUpVideo();
});