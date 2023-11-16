import { expose } from 'comlink';
import imageCompression from 'browser-image-compression';

const worker = {
  async compressImage(file) {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return new Blob([compressedFile], {type: file.type});
    } catch (error) {
        console.error('Error saat melakukan kompresi gambar:', error);
    }
  }
};

expose(worker);
