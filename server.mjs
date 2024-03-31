
//npm install firebase@latest
//npm install moment
//npm install bootstrap
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
  auth: "r8_76tam9ieUSLgHdUyQvo0dXbHlH279z92Q7iBP",
});

const model = "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb";

app.use(express.json());
app.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/generate-audio", upload.single("audioFile"), async (req, res) => {
  try {
      // Upload the audio file to an S3 bucket if provided
      let publicAudioUrl = null;
      if (req.file) {
          const params = {
              Bucket: "testsandy123",
              Key: `${Date.now()}-${req.file.originalname}`,
              Body: req.file.buffer,
              ContentType: 'audio/mpeg',
              ACL: 'public-read', // Make the uploaded file publicly accessible
          };

          const uploadResponse = await s3.upload(params).promise();
          publicAudioUrl = uploadResponse.Location;
          console.log("Uploaded Audio URL:", publicAudioUrl);
      }
      let output=null;
       if(publicAudioUrl!=null)
       {
            output = await replicate.run(model, {
              // input: {
              //     model_version: "melody",
              //     prompt: req.body.prompt,
              //     duration: 8,
              //     input_audio: publicAudioUrl, // Use the public URL from S3 if available
              // },
              input: {
                top_k: 250,
                top_p: 0,
                prompt: req.body.prompt,
                duration: 8,
                input_audio: publicAudioUrl,
                temperature: 1,
                continuation: false,
                model_version: "stereo-large",
                output_format: "mp3",
                continuation_start: 0,
                multi_band_diffusion: false,
                normalization_strategy: "peak",
                classifier_free_guidance: 3
              },
          });
       }
       else
       {
          output = await replicate.run(model, {
            // input: {
            //     model_version: "melody",
            //     prompt: req.body.prompt,
            //     duration: 8,
            //     // input_audio: publicAudioUrl, // Use the public URL from S3 if available
            // },
            input: {
                top_k: 250,
                top_p: 0,
                prompt: req.body.prompt,
                duration: 8,
                temperature: 1,
                continuation: false,
                model_version: "stereo-large",
                output_format: "mp3",
                continuation_start: 0,
                multi_band_diffusion: false,
                normalization_strategy: "peak",
                classifier_free_guidance: 3
              },
        });
       }

      const audioUrl = output;
      console.log("Generated Audio URL:", audioUrl);

      // Get the current date and time using moment.js
      const currentMoment = moment();
      const formattedMoment = currentMoment.format('YYYY-MM-DD HH:mm:ss');

      // Define data structure
      const tableName = "musiclinks";

      // Multiple data entries as an object
      const dataEntries = {
          DataAndTime: formattedMoment,
          DeviceID: deviceId,
          link: audioUrl,
          name: req.body.name,
          isPlayed: "N"
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
