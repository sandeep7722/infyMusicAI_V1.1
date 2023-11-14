document.addEventListener("DOMContentLoaded", function () {
    const generationForm = document.getElementById("generationForm");
    const promptInput = document.getElementById("prompt");
    const nameInput = document.getElementById("userName");
    const audioFileInput = document.getElementById("audioFile");
    const audioPlayer = document.getElementById("audioPlayer");

    generationForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const prompt = promptInput.value;
        const name = nameInput.value;
        const audioFile = audioFileInput.files[0];

        if (prompt) {
            const formData = new FormData();
            formData.append("prompt", prompt);
            formData.append("name", name);

            if (audioFile) {
                formData.append("audioFile", audioFile);
            }
          

            try {
                const response = await fetch("/generate-audio", {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.audioUrl) {
                        audioPlayer.src = data.audioUrl;
                        audioPlayer.play();
                    } else {
                        console.error("No audio URL received.");
                    }
                } else {
                    console.error("Error generating audio.");
                }
            } catch (error) {
                console.error("Error generating audio:", error);
            }
        }
    });
});
