let mediaRecorder: MediaRecorder | null = null;

export const initializeMediaRecorder = async () => {
  return new Promise<void>((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const startRecording = () => {
  mediaRecorder?.start();
};

export const stopRecording = () => {
  mediaRecorder?.stop();
};

export const setOnDataAvailable = (callback: (data: Blob) => void) => {
  if (mediaRecorder) {
    mediaRecorder.ondataavailable = (event) => {
      callback(event.data as Blob);
    };
  }
};

export const transcribeAudio = async (audio: Blob, apiKey: string) => {
  const audioFile = new File([audio], "audio.wav", { type: "audio/wav" });
  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("model", "whisper-1");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (response.status === 401) {
      console.error("Authentication failed. Please check your API key.");
      return;
    }

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return;
    }

    const data = await response.json();
    const transcript = data.text; 
    console.log("Transcript:", transcript);
    return transcript;
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

export const handleAudioTranscription = async (
  audioBlob: Blob | null,
  apiKey: string | null
) => {
  if (!audioBlob || !apiKey) return;

  // Convert the Blob to a File
  const audioFile = new File([audioBlob], "audio.wav", {
    type: "audio/wav",
  });

  // Create a FormData object to hold the audio file
  const formData = new FormData();
  formData.append("audio", audioFile);

  // Send the audio file to your server or directly to OpenAI API
  try {
    const response = await fetch("https://api.openai.com/v1/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const transcript = data.text; // Adjust this based on the actual API response structure
      console.log("Transcript:", transcript);
      return transcript;
    } else {
      console.log("Failed to transcribe audio");
      return null;
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
};
