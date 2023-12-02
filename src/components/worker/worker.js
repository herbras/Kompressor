import { expose } from 'comlink';
import imageCompression from 'browser-image-compression';

const worker = {
  async compressImage(file, progressCallbackProxy, abortSignal) {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      onProgress: (percentage) => {
        if (progressCallbackProxy) {
          progressCallbackProxy.update(percentage);
        }
      },
      signal: abortSignal, // Menambahkan AbortSignal ke dalam options
    };
  
    try {
      const compressedFile = await imageCompression(file, options);
      return new Blob([compressedFile], { type: file.type });
    } catch (error) {
      if (abortSignal.aborted) {
        console.log('Compression aborted:', file.name);
      } else {
        console.error('Error during image compression:', error);
      }
    }
  }
  
};

expose(worker);
