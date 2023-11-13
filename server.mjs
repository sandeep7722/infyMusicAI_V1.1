
//npm install firebase@latest
import express from "express";
import Replicate from "replicate";
import multer from "multer";
import AWS from "aws-sdk";
import fetch from "node-fetch";
import "cross-fetch/dist/node-polyfill.js";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

global.fetch = fetch;

const app = express();
const port = 3000;
//============================= fire base
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuHQixzdhBKHKRb9xXDGcctdeG86VJhEY",
  authDomain: "uploadtext-e99ee.firebaseapp.com",
  databaseURL: "https://uploadtext-e99ee-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "uploadtext-e99ee",
  storageBucket: "uploadtext-e99ee.appspot.com",
  messagingSenderId: "216361135037",
  appId: "1:216361135037:web:44d7e04d0f907123d080d4",
  measurementId: "G-L070BD1M6B"
};

// Initialize Firebase app
const appIni = initializeApp(firebaseConfig);

// Get a reference to the database
const firebaseDB = getDatabase(appIni);



// Configure AWS SDK with your credentials
AWS.config.update({
  accessKeyId: "AKIAZQJQYYCWBCBM3B6P",
  secretAccessKey: "8oed+iz0FlOXMWovXGmwubRJOqR9XDYL++tYrFZA",
  region: "ap-south-1",
});

const s3 = new AWS.S3();
const replicate = new Replicate({
  auth: "r8_Vdzl2SE8fN2qJuOczQjXZZUq5jm4cMx4LM4lO",
});

const model = "meta/musicgen:7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906";

app.use(express.json());
app.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/generate-audio", upload.single("audioFile"), async (req, res) => {
  try {
    // Upload the audio file to an S3 bucket
    const params = {
      Bucket: "testsandy123",
      Key: `${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: ';audio/mpeg',
      ACL: 'public-read', // Make the uploaded file publicly accessible
    };

    const uploadResponse = await s3.upload(params).promise();
    console.log(uploadResponse);
    const publicAudioUrl = uploadResponse.Location;
    console.log(publicAudioUrl);

    const output = await replicate.run(model, {
      input: {
        model_version: "melody",
        prompt: req.body.prompt,
        duration: 8,
        input_audio: publicAudioUrl, // Use the public URL from S3
      },
    });

    const audioUrl = output;
    console.log("Generated Audio URL:", audioUrl);

    // upload url on firebase
    
    set(ref(firebaseDB, 'theText'), audioUrl)
    .then(() => {
      console.log('Url uploaded on firebase successfully.');
    })
    .catch((error) => {
      console.error('Error adding data: ', error);
    });


    res.json({ audioUrl });
  } catch (error) {
    console.error("Error generating audio:", error);
    res.status(500).json({ error: "Failed to generate audio." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
