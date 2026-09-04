import { useState } from "react";

// Injected by Vite at build time — see firebase.js for the same
// pattern and why the VITE_ prefix is required.
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export function useCloudinaryUpload() {
  const [progress, setProgress] = useState(0);

  const uploadImage = (file) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText).secure_url);
        } else {
          reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload."));
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  };

  const uploadImages = async (files) => {
    const urls  = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const url = await new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("upload_preset", UPLOAD_PRESET);

        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const fileProgress = e.loaded / e.total;
            setProgress(Math.round(((i + fileProgress) / total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText).secure_url);
          } else {
            reject(new Error(`Upload failed for file ${i + 1}: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error(`Network error uploading file ${i + 1}.`));
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
        xhr.send(formData);
      });
      urls.push(url);
    }
    return urls;
  };

  const resetProgress = () => setProgress(0);

  return { uploadImage, uploadImages, progress, resetProgress };
}
