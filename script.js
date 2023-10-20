document.addEventListener("DOMContentLoaded", () => {
    // Referencing DOM elements
    const maskName = document.getElementById("maskName");
    const changeMaskButton = document.getElementById("changeMask");
    const toggleStartStopButton = document.getElementById("toggleStartStop");
    const toggleExperimentalModeButton = document.getElementById("toggleExperimentalMode");
    const takeScreenshotButton = document.getElementById("takeScreenshot");
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");

    // Initializing variables which are important for the webcam functionality
    const mediaDevices = navigator.mediaDevices;
    const ctx = canvas.getContext("2d");

    // Initializing model variable for face detection library
    let model;

    // Initializing variables for button mapping
    let isRunning = false;
    let selectedMask = 0;
    let isExperimentalModeEnabled = false;

    // List of masks which are in the /img/masks directory
    // This list also contains size and position offsets to further optimize the fitment of the masks to the face of the user
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

    // Setup for the webcam in the browser
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

    // Method to detect and mask the faces visible on the webcam
    const detectFaces = async () => {
        // Call to library which estimates where it thinks the faces could be
        const faces = await model.estimateFaces(video, false);
        // Check if experimental mode is selected and which mask method has to be used
        isExperimentalModeEnabled ? experimentalMask(faces) : mask(faces);
    }

    // Method to draw masks onto the canvas
    // This is the primitive method which only uses images as masks
    const mask = (faces) => {
        // Create new image object and load in selected mask from the mask list
        let image = new Image();
        image.src = masks[selectedMask].src;

        // Continue if image has successfully loaded
        if (isRunning) image.onload = () => {
            // Clear canvas from previous mask drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Go through each detected face
            faces.forEach((face) => {
                // Declare width and height of the current face so this can later be used for the positioning of the mask
                let faceWidth = face.bottomRight[0] - face.topLeft[0];
                let faceHeight = face.bottomRight[1] - face.topLeft[1];

                // Draw mask onto canvas
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

    // Method to draw masks onto the canvas
    // This is the advanced method which tracks not only the head but also the face
    // This method does not work with images and therefore only has one example (only a proof of concept)
    // The mask is hard coded into the algorithm and adding more masks would require a bit of modification to the code
    const experimentalMask = (faces) => {
        // Clear canvas from previous mask drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Go through each detected face
        faces.forEach((face) => {
            // Declare variables for face tracking so this can later be used for the positioning of the different components
            let faceWidth = face.bottomRight[0] - face.topLeft[0];
            let faceHeight = face.bottomRight[1] - face.topLeft[1];
            let faceX = face.topLeft[0] + (faceWidth / 2);
            let faceY = face.topLeft[1] + (faceHeight / 2);
            let leftEyeY = 0;
            let rightEyeY = 0;

            // Draw basic shape of the mask
            drawCircle(faceX, faceY, (faceWidth * 0.5), 0, Math.PI * 2, "yellow");

            // Go through each landmark of the face
            face.landmarks.forEach((landmark, i) => {
                // Detect which facial component is currently selected and draw component
                switch(i) {
                    case 0:
                        // Draw left eye
                        drawCircle(landmark[0], landmark[1], (faceWidth * 0.15), 0, Math.PI * 2, "white");
                        drawCircle(landmark[0] + ((landmark[0] - faceX) * 0.5) + (faceWidth * 0.1), landmark[1] + ((landmark[1] - faceY)) + (faceWidth * 0.15), (faceWidth * 0.05), 0, Math.PI * 2, "black");
                        leftEyeY = landmark[1];
                        break;
                    case 1:
                        // Draw right eye
                        drawCircle(landmark[0], landmark[1], (faceWidth * 0.15), 0, Math.PI * 2, "white");
                        drawCircle(landmark[0] + ((landmark[0] - faceX) * 0.5) - (faceWidth * 0.1), landmark[1] + ((landmark[1] - faceY)) + (faceWidth * 0.15), (faceWidth * 0.05), 0, Math.PI * 2, "black");
                        rightEyeY = landmark[1];
                        break;
                    case 2:
                        // Draw nose
                        drawCircle(landmark[0], landmark[1] - (faceHeight * 0.1), (faceWidth * 0.05), 0, Math.PI * 2, "orange");
                        break;
                    case 3:
                        // Draw mouth
                        drawCircle(landmark[0], landmark[1] - (faceHeight * 0.1), (faceWidth * 0.2), (rightEyeY - leftEyeY) * 0.02, (rightEyeY - leftEyeY) * 0.02 + Math.PI, "black");
                        break;
                    case 4:
                        // Draw left ear
                        break;
                    case 5:
                        // Draw right ear
                        break;
                }
            });
        });
    }

    // Method to draw a circle onto the canvas
    // This is mainly used in the experimental masking method
    const drawCircle = (x, y, radius, startAngle, endAngle, color) => {
        ctx.beginPath();
        ctx.arc(x, y , radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    // Event listener which waits until the metadata is loaded
    video.addEventListener("loadedmetadata", async () => {
        // Show webcam feed
        video.play();
        // Load face detection library into the model variable
        model = await blazeface.load();
    });

    // Event listener which waits until the start / stop button is clicked
    toggleStartStopButton.addEventListener("click", async () => {
        // Change status
        isRunning = !isRunning;

        // Handle buttons and text in DOM
        if (isRunning) {
            toggleStartStopButton.innerText = "Stop"
            maskName.innerText = isExperimentalModeEnabled ? "Experimental Mode" : masks[selectedMask].name;
        } else {
            toggleStartStopButton.innerText = "Start";
            maskName.innerText = "[Stopped]";
        }
        changeMaskButton.disabled = !isRunning || isExperimentalModeEnabled;
        toggleExperimentalModeButton.disabled = !isRunning;

        // Check if masks should be applied
        while (isRunning) {
            await detectFaces();
        }
        // When stopped clear canvas from any remaining masks
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    });

    // Event listener which waits until the change mask button is clicked
    changeMaskButton.addEventListener("click", () => {
        // Logic for mask selection
        selectedMask < masks.length - 1 ? selectedMask++ : selectedMask = 0;
        // Changing displayed mask name
        maskName.innerText = masks[selectedMask].name;
    });

    // Event listener which waits until the toggle experimental mode button is clicked
    toggleExperimentalModeButton.addEventListener("click", () => {
        // Change status
        isExperimentalModeEnabled = !isExperimentalModeEnabled;

        // Handle buttons and text in DOM
        changeMaskButton.disabled = isExperimentalModeEnabled;
        maskName.innerText = isExperimentalModeEnabled ? "Experimental Mode" : masks[selectedMask].name;
    });

    // Event listener which waits until the take screenshot button is clicked
    takeScreenshotButton.addEventListener("click", async () => {
        // Create new canvas which will be used to merge the webcam screenshot and the mask drawing canvas into one picture
        const screenshotCanvas = document.createElement("canvas");
        screenshotCanvas.width = canvas.width;
        screenshotCanvas.height = canvas.height;

        // Create context of the screenshot canvas
        const screenshotCtx = screenshotCanvas.getContext("2d");
        screenshotCtx.drawImage(video, 0, 0);
        screenshotCtx.drawImage(canvas, 0, 0);

        // Create new image object and declare the screenshot canvas as a source
        const img = new Image();
        const dataURL = screenshotCanvas.toDataURL("image/jpg");
        img.src = dataURL;

        // Create download link for the screenshot
        const downloadLink = document.createElement("a");
        downloadLink.href = dataURL;
        downloadLink.download = "screenshot.jpg";
        // Click the download link automatically
        downloadLink.click();
    });

    // Call webcam setup
    setUpVideo();
});