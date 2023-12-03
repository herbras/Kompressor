import { writable, derived } from 'svelte/store';
import { set, get, del, keys, clear } from 'idb-keyval';
import JSZip from "jszip";

// Store untuk menyimpan daftar file
export const files = writable([]);

// Store untuk menyimpan halaman saat ini
export let currentPage = writable(1);

// Store untuk status loading
export const loading = writable(false);

// Store untuk kemajuan file
export const fileProgress = writable(0);

// Store untuk pesan pengguna
export const userMessage = writable("");

// Konstanta untuk item per halaman
const itemsPerPage = 4;

// Store turunan untuk mengelola pagination
export const paginatedFiles = derived(
    [files, currentPage],
    ([$files, $currentPage]) => {
        const startIndex = ($currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return $files.slice(startIndex, endIndex);
    }
);

// Fungsi untuk menghapus file tertentu
export async function removeFile(fileId) {
    let fileNameToDelete;
    files.update(currentFiles => {
        const fileToRemove = currentFiles.find(file => file.id === fileId);
        fileNameToDelete = fileToRemove ? fileToRemove.newFileName : null;
        return currentFiles.filter(file => file.id !== fileId);
    });

    if (fileNameToDelete) {
        try {
            await del(fileNameToDelete);
        } catch (error) {
            console.error("Error deleting file from IndexedDB:", error);
        }
    }
}

// Fungsi untuk menghapus semua file
export async function removeAllFiles() {
    await clear();
    files.set([]);
}

// Fungsi untuk mengunduh semua file
export async function downloadAll() {
    const zip = new JSZip();
    let $filesValue;

    files.subscribe((value) => {
        $filesValue = value;
    })();

    $filesValue.forEach((file) => {
        zip.file(file.newFileName, file.after.split("base64,")[1], {
            base64: true,
        });
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "minimizeSarbeh.zip";
    a.click();
}
export const totalPages = derived(
    [files, currentPage],
    ([$files, $currentPage]) => Math.ceil($files.length / itemsPerPage)
  );

export let isInputInvalid = writable(false);
