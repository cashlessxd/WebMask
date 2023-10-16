document.addEventListener("DOMContentLoaded", () => {
    let video = document.getElementById("video");
    let mediaDevices = navigator.mediaDevices;

    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    let model;

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
        const prediction = await model.estimateFaces(video, false);
        mask(prediction[0].topLeft, prediction[0].bottomRight);
    }


    const mask = (topLeft, bottomRight) => {
        faceWidth = bottomRight[0] - topLeft[0];
        faceHeight = bottomRight[1] - topLeft[1];

        let image = new Image();
        image.src = "img/masks/surprised_emoji.png";
        image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(image, topLeft[0], topLeft[1], faceWidth, faceHeight);
        }
    }

    setUpVideo();

    video.addEventListener("loadedmetadata", async () => {
        video.play();
        model = await blazeface.load();
        while (true) {
            await detectFaces();
        }
    });
});

