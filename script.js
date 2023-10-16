document.addEventListener("DOMContentLoaded", () => {
    let video = document.getElementById("video");
    let mediaDevices = navigator.mediaDevices;

    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");

    let model;

    let selectedImage = 0;
    const images = [
        {
            src: "img/masks/batman.png",
            sizeOffsetX: 80,
            sizeOffsetY: 150,
            posOffsetX: 40,
            posOffsetY: 150,
        },
        {
            src: "img/masks/surprised_emoji.png",
            sizeOffsetX: 80,
            sizeOffsetY: 150,
            posOffsetX: 40,
            posOffsetY: 100,
        }
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
        mask(faces);
    }


    const mask = (faces) => {
        let image = new Image();
        image.src = images[selectedImage].src;
        image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            faces.forEach((face) => {
                let faceWidth = face.bottomRight[0] - face.topLeft[0];
                let faceHeight = face.bottomRight[1] - face.topLeft[1];
                ctx.drawImage(
                    image,
                    face.topLeft[0] - images[selectedImage].posOffsetX,
                    face.topLeft[1] - images[selectedImage].posOffsetY,
                    faceWidth + images[selectedImage].sizeOffsetX,
                    faceHeight + images[selectedImage].sizeOffsetY
                );
            });
        }
    }

    setUpVideo();

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
});

