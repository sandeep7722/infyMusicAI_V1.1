
//npm install firebase@latest
//npm install moment
import express from "express";
import Replicate from "replicate";
import multer from "multer";
import AWS from "aws-sdk";
import fetch from "node-fetch";
import "cross-fetch/dist/node-polyfill.js";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set } from 'firebase/database';
import  os  from 'os';
import moment from 'moment';

global.fetch = fetch;

const app = express();
const port = 3000;
//============================= fire base
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFkoPpzlsshRavtUxxMDFrdH6uNvTYDAc",
  authDomain: "icetsmusicgenai.firebaseapp.com",
  databaseURL: "https://icetsmusicgenai-default-rtdb.firebaseio.com",
  projectId: "icetsmusicgenai",
  storageBucket: "icetsmusicgenai.appspot.com",
  messagingSenderId: "126843020120",
  appId: "1:126843020120:web:c8e2249649960c3843bb2d",
  measurementId: "G-YCHBMGNGKJ"
};

// Initialize Firebase app
const appIni = initializeApp(firebaseConfig);

// Get a reference to the database
const firebaseDB = getDatabase(appIni);

//---------------------------for device id--------------
// Get the network interfaces
const networkInterfaces = os.networkInterfaces();

// Find a suitable network interface to use as the device ID
let deviceId = '';
for (const key of Object.keys(networkInterfaces)) {
  const networkInterface = networkInterfaces[key][0];
  if (networkInterface && networkInterface.mac && networkInterface.mac !== '00:00:00:00:00:00') {
    deviceId = networkInterface.mac;
    break;
  }
}

console.log('Device ID:', deviceId);




//------------------------------------------------aws------
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

    //--------------------------for date and time('YYYY-MM-DD HH:mm:ss')-------------
    // Get the current date and time using moment.js
    const currentMoment = moment();

    // Format the date as a string
    const formattedMoment = currentMoment.format('YYYY-MM-DD HH:mm:ss');

    console.log('Current Date and Time:', formattedMoment);

    //---------------------------uploading data in firebase---

    // Define data structure
    const tableName = "musiclinks";

    // Multiple data entries as an object
    const dataEntries = {
      DataAndTime: formattedMoment,
      DeviceID: deviceId,
      link: audioUrl,
      name: req.body.name,
      isPlayed: "N"
      // Add more key-value pairs as needed
    };

    // Create a reference to the table in the database and use push to generate a unique key
    const newEntryRef = push(ref(firebaseDB, tableName));

    // Set the data at the generated key
    set(newEntryRef, dataEntries)
      .then(() => {
        console.log('Data added in firebase successfully.');
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
