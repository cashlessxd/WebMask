document.addEventListener("DOMContentLoaded", () => {
    let showCamButton = document.getElementById("showCam");
    let video = document.getElementById("video");
    let mediaDevices = navigator.mediaDevices;

    showCamButton.addEventListener("click", () => {
        mediaDevices
            .getUserMedia({
                video: true,
                audio: true,
            })
            .then((stream) => {
                video.srcObject = stream;
                video.addEventListener("loadedmetadata", () => {
                    video.play();
                });
            })
            .catch(alert);

        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        let image = new Image();
        image.src = "img/masks/surprised_emoji.png";
        image.onload = () => {
            ctx.drawImage(image, 10, 10, 100, 100);
        }
    });
});

