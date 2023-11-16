<script>
  import { wrap } from "comlink";
  import JSZip from "jszip";
  import { onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import Worker from "./worker/worker?worker";
  let sseData = writable({ fileCount: 0, totalSizeGB: 0 });
  let eventSource;

  function openSSE() {
    eventSource = new EventSource("https://webp.qlm.one/sse");
    eventSource.onmessage = function (event) {
      const data = JSON.parse(event.data);
      sseData.set(data);
    };
    eventSource.onerror = function () {
      console.error("EventSource failed, reconnecting...");
      eventSource.close();
      setTimeout(openSSE, 1000);
    };
  }
  // Buka koneksi SSE saat komponen di-mount
  openSSE();

  // Tutup koneksi SSE saat komponen di-destroy
  onDestroy(() => {
    eventSource.close();
  });

  const worker = wrap(new Worker());
  const files = writable(
    JSON.parse(localStorage.getItem("convertedFiles") || "[]")
  );

  const MAX_FILE_SIZE_MB = 1;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  async function blobToBase64(blob) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  let isProcessing = false; // Menandakan apakah sedang dalam proses
  let progress = 0; // Menandakan progress dari 0 sampai 100

  async function processFiles(fileArray) {
    isProcessing = true;
    progress = 0;

    const totalFiles = fileArray.length;

    for (const [index, file] of fileArray.entries()) {
      let formData = new FormData();
      const originalFileSize = file.size;
      if (file.size > MAX_FILE_SIZE_BYTES) {
        try {
          const compressedBlob = await worker.compressImage(file);
          formData.append("files", compressedBlob, file.name);
        } catch (error) {
          console.error("Error saat melakukan kompresi gambar:", error);
        }
      } else {
        formData.append("files", file);
      }

      // Kode untuk mengirim ke API
      try {
        const response = await fetch("https://webp.qlm.one/convert", {
          method: "POST",
          headers: {
            "X-Original-File-Size": originalFileSize.toString(),
          },
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          if (blob.type.startsWith("image/")) {
            const base64Data = await blobToBase64(blob);
            const convertedFile = { original: file, converted: base64Data };
            files.update((n) => [...n, convertedFile]);
            localStorage.setItem(
              "convertedFiles",
              JSON.stringify([...$files, convertedFile])
            );
          } else {
            console.error("File received is not an image");
          }
        } else {
          console.error(
            "Failed to convert image:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("An error occurred:", error);
      }

      progress = Math.floor(((index + 1) / totalFiles) * 100);
    }

    isProcessing = false;
  }

  let namaku = "sarbeh.webp";

  function downloadIndividualFile(file) {
    const originalNameWithoutExtension = file.original.name
      .split(".")
      .slice(0, -1)
      .join(".");
    const newFileName = `${originalNameWithoutExtension}_${namaku}`;
    const a = document.createElement("a");
    a.href = file.converted;
    a.download = newFileName;
    a.click();
  }
  async function downloadAllFiles() {
    const zip = new JSZip();
    const folder = zip.folder("converted_images");

    for (const [index, file] of $files.entries()) {
      const blob = await fetch(file.converted).then((r) => r.blob());
      const originalNameWithoutExtension = file.original.name
        .split(".")
        .slice(0, -1)
        .join(".");
      const newFileName = `${originalNameWithoutExtension}_${namaku}`;
      folder.file(newFileName, blob);
    }

    zip.generateAsync({ type: "blob" }).then((content) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = "Jadi_WEBP.zip";
      a.click();
    });
  }

  function clearFiles() {
    files.set([]);
    localStorage.removeItem("convertedFiles");
  }

  onDestroy(() => {
    worker.terminate(); // Terminate worker on component destroy
  });
  sseData.update(currentValue => {
  // Misalnya, menambah 1 pada fileCount
  return { ...currentValue, fileCount: currentValue.fileCount + 1 };
});
const unsubscribe = sseData.subscribe(updatedValue => {
  console.log("Nilai terbaru:", updatedValue);
});
const byteUnits = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

$: totalFilesConverted = $sseData.totalFilesConverted;
$: totalSizeConverted = $sseData.totalSizeConverted;
$: sizeUnit = Math.floor(Math.log(totalSizeConverted) / Math.log(1024));
$: totalSizeFormatted = (totalSizeConverted / Math.pow(1024, sizeUnit)).toFixed(2);
$: sizeLabel = byteUnits[sizeUnit];
</script>

<svelte:window on:paste={(e) => processFiles([...e.clipboardData?.files])} />
  <div class="text-center my-4 bg-white p-4 rounded-lg shadow-md">
    {#if totalFilesConverted > 0}
      <h2 class="text-lg font-semibold">Statistik Aplikasi ini:</h2>
      <p class="text-gray-700">Total File Terkonversi: {totalFilesConverted}</p>
      <p class="text-gray-700">
        Total Ukuran Terkonversi: {totalSizeFormatted} {sizeLabel}
      </p>
    {:else}
      <p class="text-gray-700">Belum ada data yang diterima.</p>
    {/if}
  </div>

<main
  class="flex flex-col items-center justify-center min-h-screen bg-blue-200 p-4"
  on:dragover={(e) => e.preventDefault()}
  on:drop={(e) => {
    e.preventDefault();
    console.log("Dropped:", e.dataTransfer.files); // tambahkan ini
    processFiles([...e.dataTransfer.files]);
  }}
>
  <form class="space-y-4 bg-white rounded-lg shadow-md p-8">
    <label
      class="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md hover:bg-gray-50 hover:border-gray-500 cursor-pointer transition-all duration-200 ease-in"
    >
      <span class="mt-2 text-sm text-gray-600"
        >Click or drag to upload an image</span
      >
      <input
        type="file"
        name="files"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        on:change={(e) => processFiles([...e.target.files])}
        class="hidden"
      />
    </label>
  </form>

  <p class="mt-4 text-center text-lg text-gray-800">
    Alternatively, paste an image from your clipboard.
  </p>

  {#if $files.length > 0}
    <ul class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each $files as file, index}
        <li
          class="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200"
        >
          <div class="p-4">
            <img
              src={file.converted}
              alt={file.original.name}
              class="w-full h-32 object-cover rounded"
            />
          </div>
          <div class="w-full flex items-center justify-between p-4 space-x-4">
            <div class="flex-1 truncate">
              <h3 class="text-gray-900 text-sm leading-6 truncate">
                {file.original.name}
              </h3>
            </div>
          </div>
          <div class="p-4">
            <button
              on:click={() => downloadIndividualFile(file)}
              class="w-full inline-flex items-center justify-center py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
            >
              Download Converted Image
            </button>
          </div>
        </li>
      {/each}
    </ul>
    <button
      on:click={downloadAllFiles}
      class="mt-8 inline-block rounded-full px-12 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#31bdc6] to-[#3178c6] dark:from-[#1E1E1E] dark:to-[#000000] hover:from-[rgba(49,189,198,0.8)] hover:to-[rgba(49,120,198,0.8)] focus:ring focus:ring-[#31bdc6] focus:ring-opacity-50 active:from-[rgba(49,120,198,0.8)] active:to-[rgba(49,189,198,0.8)] transition-all ease-in-out duration-300"
    >
      ZIP IT
    </button>
    <button
      on:click={clearFiles}
      class="mt-8 inline-block rounded-full px-12 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#31bdc6] to-[#3178c6] dark:from-[#1E1E1E] dark:to-[#000000] hover:from-[rgba(49,189,198,0.8)] hover:to-[rgba(49,120,198,0.8)] focus:ring focus:ring-[#31bdc6] focus:ring-opacity-50 active:from-[rgba(49,120,198,0.8)] active:to-[rgba(49,189,198,0.8)] transition-all ease-in-out duration-300"
    >
      Clear All Files
    </button>
  {/if}
  {#if isProcessing}
    <div
      class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg text-center">
        <img
          src="https://media.tenor.com/ycKJas-YT0UAAAAM/im-waiting-aki-and-paw-paw.gif"
          alt="Loading GIF"
        />
        <progress value={progress} max="100" class="w-full mb-4" />
        <h2 class="text-lg font-semibold text-gray-700 mb-2">
          Mengompresi Gambar: {progress}%
        </h2>
        <p class="text-sm text-gray-500">
          Harap tunggu, ini akan memakan waktu beberapa detik.
        </p>
      </div>
    </div>
  {/if}
</main>
