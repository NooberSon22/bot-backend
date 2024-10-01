import express from "express";
import dotenv from "dotenv";
import { createClient } from "@deepgram/sdk";
import fs from "fs";
import multer from "multer";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
dotenv.config();

app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);
app.use(express.json());

// Initialize Deepgram client
const deepgram = createClient(process.env.DEEPGRAM_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_KEY });

// app.post("/upload-audio", upload.single("audio"), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: "No file uploaded" });
//   }

//   const audioPath = req.file.path;
//   console.log(audioPath);

//   try {
//     const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
//       fs.readFileSync(audioPath),
//       {
//         model: "nova-2",
//         smart_format: true,
//       }
//     );
//     console.log(error);

//     if (error) {
//       throw new Error(error);
//     }

//     res.status(200).json(result);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   } finally {
//     fs.unlinkSync(audioPath);
//   }
// });

app.post("/upload-audio", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const audioPath = req.file.path;

  try {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "distil-whisper-large-v3-en", // Required model to use for transcription
      response_format: "json",
      temperature: 0.0,
    });

    if (transcription.error) {
      throw new Error(transcription.error);
    }

    const result = {
      data: transcription.text,
    };

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    fs.unlinkSync(audioPath);
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
