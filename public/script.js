
function showLoading() {
    document.getElementById('loading-spinner').style.display = 'block';
    
}


function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
}

        var intervalId;
        var numbers = ["1", "2", "3"];
        var index = 0;

        function showNumber() {
            document.getElementById('numberDisplay').innerText = numbers[index];
            index = (index + 1) % numbers.length;
            // index = (index + 1);
        }

        function startDisplay() {
            // Start interval and save the ID
            intervalId = setInterval(showNumber, 1000);
        }

        function stopDisplay() {
            // Clear the interval using the saved ID
            clearInterval(intervalId);
        }


document.addEventListener("DOMContentLoaded", function () {
    
    const generationForm = document.getElementById("generationForm");
    const promptInput = document.getElementById("prompt");
    const nameInput = document.getElementById("userName");
    const audioFileInput = document.getElementById("audioFile");
    const audioPlayer = document.getElementById("audioPlayer");
    const loadingSpinner = document.getElementById('loading-spinner');

    generationForm.addEventListener("submit", async function (event) {
        

        event.preventDefault();
        //show loading spinner
       showLoading();
       startDisplay()
    
        
       
       

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
                        //hide loading spinner
                        stopDisplay()
                        hideLoading();
                        
                        


                        audioPlayer.style.display = 'block';
                       
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
