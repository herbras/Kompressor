<script>
  import { files } from "./store.js";

  import { wrap, proxy } from "comlink";
  import { writable } from "svelte/store";
  import Worker from "./worker/worker?worker";
  import { set, get, keys } from "idb-keyval";

  import { v4 as uuidv4 } from "uuid";
  let fileProgress = writable(0);
  import { onMount , createEventDispatcher} from "svelte";

const dispatch = createEventDispatcher();
  let loading = writable(false);
  const worker = wrap(new Worker());
  let userMessage = writable("");

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
  const processFiles = async (newFiles) => {
    loading.set(true);
    const existingKeys = await keys();

    // Process each file and collect promises
    const newFilePromises = newFiles.map(async (newFile) => {
      let fileName = newFile.name;
      let duplicateCount = 0;
      const splitName = fileName.split(".");
      const uniqueId = uuidv4();
      let baseName = splitName.slice(0, -1).join(".");
      let extension = splitName.at(-1); // Use .at(-1) to get the last item
      baseName += "-sarbeh";
      const previewUrl = URL.createObjectURL(newFile);
      // Cek apakah format WebP dipilih
      if (isWebp) {
        extension = "webp"; // Ubah ekstensi ke .webp
      }
      while (
        existingKeys.includes(
          `${baseName}${
            duplicateCount > 0 ? `-${duplicateCount}` : ""
          }.${extension}`,
        )
      ) {
        duplicateCount++;
      }

      fileName = `${baseName}${
        duplicateCount > 0 ? `-${duplicateCount}` : ""
      }.${extension}`;

      const progressUpdater = {
        update: (progress) => {
          fileProgress.set(progress);
        },
      };

      // Proxy the progress updater
      const progressCallbackProxy = proxy(progressUpdater);

      // Pass the proxied object to the worker
      const compressedFileBlob = await worker.compressImage(
        newFile,
        progressCallbackProxy,
      );

      let finalImageBlob = compressedFileBlob;

      if (isWebp) {
        try {
          const formData = new FormData();
          formData.append("file", compressedFileBlob, fileName);

          const response = await fetch("https://webp.qlm.one/convert", {
            method: "POST",
            headers: {
              "X-Original-File-Size": compressedFileBlob.size.toString(),
            },
            body: formData,
          });

          if (response.ok) {
            finalImageBlob = await response.blob();
            if (!finalImageBlob.type.startsWith("image/")) {
              throw new Error("File received is not an image");
            }
          } else {
            throw new Error(
              `Failed to convert image: ${response.status} ${response.statusText}`,
            );
          }
        } catch (error) {
          console.error("An error occurred during WebP conversion:", error);
          // Jika konversi gagal, lanjutkan dengan gambar asli
        }
      }

      const base64 = await fileToBase64(finalImageBlob);

      // Build new file object
      return {
        before: newFile,
        newFileName: fileName,
        previewUrl,
        after: base64,
        id: uniqueId,
        loading: false,
      };
    });

    // Wait for all file processing promises to resolve
    const newFilesData = await Promise.all(newFilePromises);

    // Update the files store by appending new files to the existing list
    files.update((currentFiles) => [...currentFiles, ...newFilesData]);

    // Save to IndexedDB or wherever necessary
    newFilesData.forEach(async (fileData) => {
      fileData.loading = false;
      await set(fileData.newFileName, fileData.after);
    });

    loading.set(false);
    fileProgress.set(0); // Reset progress
    userMessage.set("Ready for more? Drag or upload new images to continue."); // Set enticing message
  };
  $: if ($loading) {
    userMessage.set("");
  }

  async function loadFilesFromIDB() {
    const keysFromIDB = await keys();
    const filesFromIDB = await Promise.all(
      keysFromIDB.map(async (key) => {
        const base64Data = await get(key);
        return {
          newFileName: key,
          after: base64Data,
          id: uuidv4(),
          loading: false,
          previewUrl: base64Data,
        };
      }),
    );

    files.set(filesFromIDB);
  }

  // Memanggil fungsi saat aplikasi dimuat
  onMount(() => {
    loadFilesFromIDB();
    dispatch('loaded');
  });

  let isWebp = false;

  // Handler untuk event storage
  function handleStorageEvent(event) {
    if (event.key === "files") {
      const newFiles = loadFilesFromLocalStorage();
      files.set(newFiles);
    }
  }
</script>

<svelte:window
  on:storage={handleStorageEvent}
  on:paste={(e) => processFiles([...e.clipboardData?.files])}
/>

<main
  class=" p-5 rounded-3xl bg-blue-200 relative"
  on:dragover={(e) => e.preventDefault()}
  on:drop={(e) => {
    processFiles([...e.dataTransfer.files]);
  }}
>
  <div
    class="flex items-center justify-center z-20 p-2 absolute top-8 right-6 bg-blue-600 rounded-full shadow-lg transition"
  >
    <label for="formatToggle" class="sr-only"
      >Change format to {isWebp ? "WEBP" : "JPG"}</label
    >
    <input
      type="checkbox"
      id="formatToggle"
      class="sr-only"
      bind:checked={isWebp}
    />
    <span class="mr-3 text-gray-100 font-medium text-lg">
      {isWebp ? "WEBP" : "JPG"}
    </span>

    <label
      for="formatToggle"
      class="relative h-8 w-14 cursor-pointer [-webkit-tap-highlight-color:_transparent] block"
    >
      <input
        type="checkbox"
        id="formatToggle"
        class="sr-only"
        bind:checked={isWebp}
      />
      <span
        class="absolute inset-0 rounded-full transition duration-300"
        class:bg-gray-300={!isWebp}
        class:bg-green-500={isWebp}
      ></span>
      <span
        class="absolute inset-y-0 m-1 h-6 w-6 rounded-full transition-all duration-300"
        class:start-0={!isWebp}
        class:bg-gray-600={!isWebp}
        class:start-6={isWebp}
        class:bg-white={isWebp}
      ></span>
    </label>
  </div>
  <form
    class="p-6 h-75 flex flex-col justify-center items-center space-y-4 rounded-xl bg-gray-100 rounded-lg shadow-md border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-500"
  >
    <label
      class="flex flex-col items-center justify-center p-4 rounded-md cursor-pointer"
    >
      <div class="bg-white shadow-md p-2 rounded-xl">
        <div class="i-tabler-upload h-9 w-9" />
      </div>
      <span class="mt-2 text-lg font-semibold text-black"
        >Click or drag to upload an image <br />
        <p class="text-sm font-thin text-gray-600">
          Alternatively, paste an image from your clipboard.
        </p>
      </span>
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
</main>
<div class="px-4 py-2">
  {#if $fileProgress > 0}
    <div
      role="progressbar"
      aria-valuenow={$fileProgress}
      aria-valuemin="0"
      aria-valuemax="100"
      class="bg-gray-200 rounded-full overflow-hidden h-2 text-xs flex"
    >
      <div
        class="bg-blue-600 h-2 rounded-full progress-bar"
        style="width: {$fileProgress}%;"
      ></div>
    </div>
    <div class="text-center text-sm mt-1">Processing: {$fileProgress}%</div>
  {:else}
    <div class="text-center text-sm mt-1">{$userMessage}</div>
  {/if}
</div>

<style>
  :root {
    --primary-color: #4a90e2; /* Adjust primary color */
    --hover-primary-color: #357abd; /* Darker shade for hover */
    --danger-color: #e74c3c; /* Red color for danger actions */
    --text-color: #333; /* Default text color */
    --font-family: "Arial", sans-serif; /* Modern font */
    --border-radius: 0.25rem; /* Border radius for roundness */
  }
  .start-0 {
    left: 0;
  }
  .start-6 {
    left: 1.5rem; /* 6 tailwind units */
  }

  /* Styles for the indeterminate progress bar */
  @keyframes loading {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }

  /* Styles for the determinate progress bar */
  .progress-bar {
    transition: width 0.5s ease-out;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    border-radius: 1px; /* Rounded corners */
    background-image: linear-gradient(to right, #4d9f0c, #1e5631);
  }
</style>
