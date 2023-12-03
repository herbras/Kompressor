<script>
    import { wrap, proxy } from "comlink";
    import { writable } from "svelte/store";
    import Worker from "../worker/worker?worker";
    import { set, get, del, keys, clear } from "idb-keyval";
    import JSZip from "jszip";
    import { v4 as uuidv4 } from "uuid";
    let fileProgress = writable(0);
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
  
    let files = writable([]);
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
    async function downloadAll() {
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
    });
    // Fungsi untuk menghapus file berdasarkan fileId
    async function removeFile(fileId) {
      let fileNameToDelete;
  
      // Update state dan temukan nama file
      files.update((currentFiles) => {
        const fileToRemove = currentFiles.find((file) => file.id === fileId);
        fileNameToDelete = fileToRemove ? fileToRemove.newFileName : null;
        return currentFiles.filter((file) => file.id !== fileId);
      });
  
      // Hapus file dari IndexedDB jika nama file ditemukan
      if (fileNameToDelete) {
        try {
          await del(fileNameToDelete);
        } catch (error) {
          console.error("Error deleting file from IndexedDB:", error);
        }
      }
    }
    async function removeAllFiles() {
      // Menghapus semua file dari IndexedDB
      await clear();
  
      // Mengosongkan state files
      files.set([]);
    }
  
    let isWebp = false;
  
    // Handler untuk event storage
    function handleStorageEvent(event) {
      if (event.key === "files") {
        const newFiles = loadFilesFromLocalStorage();
        files.set(newFiles);
      }
    }
    let currentPage = 1;
    let inputPage = ""; // Holds the user input for page number
    let isInputInvalid = false; // To show/hide the error message
    const itemsPerPage = 4;
    // Assuming $files is a Svelte store or reactive variable
    $: totalPages = Math.ceil($files.length / itemsPerPage);
    $: paginatedFiles = $files.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  
    function changePage(newPage) {
      const page = parseInt(newPage);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        currentPage = page;
        inputPage = ""; // Clear the input field
        isInputInvalid = false;
      } else {
        isInputInvalid = true;
      }
    }
  
    function handlePageInput(event) {
      if (!/^\d*$/.test(inputPage)) {
        inputPage = "";
      }
      if (event.key === "Enter") {
        changePage(inputPage);
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
      class="flex items-center justify-center z-20 p-2 absolute top-8 right-6 bg-blue-500 rounded-full shadow-lg transition"
    >
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
          class="absolute inset-y-0 m-1 h-6 w-6 rounded-full bg-white transition-all duration-300"
          class:start-0={!isWebp}
          class:start-6={isWebp}
        ></span>
      </label>
      <span class="ml-3 text-white font-medium text-lg">
        {isWebp ? "WEBP" : "JPG"}
      </span>
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
  <div class="flex flex-col md:flex-row gap-5">
    {#if $files.length > 0}
      <div class="flex pt-5 md:pt-12 flex-col">
        <div class="flex flex-col md:flex-row gap-5 mx-auto w-fit">
          <button
            on:click={removeAllFiles}
            class="px-4 py-4 bg-[#914f8f] rounded-md outline-none relative overflow-hidden border duration-300 ease-linear
      after:absolute after:inset-x-0 after:aspect-square after:scale-0 after:opacity-70 after:origin-center after:duration-300 after:ease-linear after:rounded-full after:top-0 after:left-0 after:bg-[#172554]
     text-base border-transparent relative bg-gradient-to-r from-[#6dd47e] to-[#31bdc6] dark:from-[#4CAF50] dark:to-[#087f23] hover:from-[rgba(109,212,126,0.8)] hover:to-[rgba(49,189,198,0.8)] focus:ring focus:ring-[#6dd47e] focus:ring-opacity-50 active:from-[rgba(49,189,198,0.8)] active:to-[rgba(109,212,126,0.8)] hover:after:opacity-100 hover:after:scale-[2.5] min-w-max font-bold text-white"
          >
            Hapus Semua File
          </button>
  
          <button
            on:click={downloadAll}
            class="px-4 py-4 bg-[#914f8f] rounded-md outline-none relative overflow-hidden border duration-300 ease-linear
        after:absolute after:inset-x-0 after:aspect-square after:scale-0 after:opacity-70 after:origin-center after:duration-300 after:ease-linear after:rounded-full after:top-0 after:left-0 after:bg-[#172554]
       text-base border-transparent relative bg-gradient-to-r from-[#6dd47e] to-[#31bdc6] dark:from-[#4CAF50] dark:to-[#087f23] hover:from-[rgba(109,212,126,0.8)] hover:to-[rgba(49,189,198,0.8)] focus:ring focus:ring-[#6dd47e] focus:ring-opacity-50 active:from-[rgba(49,189,198,0.8)] active:to-[rgba(109,212,126,0.8)] hover:after:opacity-100 hover:after:scale-[2.5] min-w-max font-bold text-white"
          >
            Download All
          </button>
        </div>
        <!-- Existing Pagination Controls -->
        <div class="flex pt-5 mx-auto w-fit items-center space-x-2">
          <button
            class="px-4 py-4 bg-[#914f8f] rounded-md outline-none relative overflow-hidden border duration-300 ease-linear
      after:absolute after:inset-x-0 after:aspect-square after:scale-0 after:opacity-70 after:origin-center after:duration-300 after:ease-linear after:rounded-full after:top-0 after:left-0 after:bg-[#172554]
     text-base border-transparent relative bg-gradient-to-r from-[#6dd47e] to-[#31bdc6] dark:from-[#4CAF50] dark:to-[#087f23] hover:from-[rgba(109,212,126,0.8)] hover:to-[rgba(49,189,198,0.8)] focus:ring focus:ring-[#6dd47e] focus:ring-opacity-50 active:from-[rgba(49,189,198,0.8)] active:to-[rgba(109,212,126,0.8)] hover:after:opacity-100 hover:after:scale-[2.5] min-w-max font-bold text-white"
            class:disabled-button={currentPage === 1}
            on:click={() => changePage(currentPage - 1)}
          >
            Prev
          </button>
  
          <input
            type="text"
            bind:value={inputPage}
            on:keydown={handlePageInput}
            class="text-center w-12"
            placeholder={currentPage}
          />
  
          <span>of {totalPages}</span>
  
          <button
            class="px-4 py-4 bg-[#914f8f] rounded-md outline-none relative overflow-hidden border duration-300 ease-linear
      after:absolute after:inset-x-0 after:aspect-square after:scale-0 after:opacity-70 after:origin-center after:duration-300 after:ease-linear after:rounded-full after:top-0 after:left-0 after:bg-[#172554]
     text-base border-transparent relative bg-gradient-to-r from-[#6dd47e] to-[#31bdc6] dark:from-[#4CAF50] dark:to-[#087f23] hover:from-[rgba(109,212,126,0.8)] hover:to-[rgba(49,189,198,0.8)] focus:ring focus:ring-[#6dd47e] focus:ring-opacity-50 active:from-[rgba(49,189,198,0.8)] active:to-[rgba(109,212,126,0.8)] hover:after:opacity-100 hover:after:scale-[2.5] min-w-max font-bold text-white"
            class:disabled-button={currentPage >= totalPages}
            on:click={() => changePage(currentPage + 1)}
          >
            Next
          </button>
        </div>
        {#if isInputInvalid}
          <div class="mt-3 text-center text-red-600 font-semibold">
            Maaf, filemu hanya sampai di total {totalPages} halaman.
          </div>
        {/if}
      </div>
    {:else}
      <!-- Tampilkan kontrol pagination dengan "0 of 0" -->
      <div class="flex pt-5 md:pt-12 flex-col">
        <div class="flex flex-col md:flex-row gap-5 mx-auto w-fit">
          <button
            disabled
            class="px-4 py-4 bg-[#914f8f] rounded-md outline-none relative overflow-hidden border duration-300 ease-linear
        after:absolute after:inset-x-0 after:aspect-square after:scale-0 after:opacity-70 after:origin-center after:duration-300 after:ease-linear after:rounded-full after:top-0 after:left-0 after:bg-[#172554]
        text-base border-transparent relative bg-gray-500 min-w-max font-bold text-white"
          >
            Hapus Semua File
          </button>
  
          <button
            disabled
            class="px-4 py-4 bg-[#914f8f] rounded-md outline-none relative overflow-hidden border duration-300 ease-linear
          after:absolute after:inset-x-0 after:aspect-square after:scale-0 after:opacity-70 after:origin-center after:duration-300 after:ease-linear after:rounded-full after:top-0 after:left-0 after:bg-[#172554]
          text-base border-transparent relative bg-gray-500 min-w-max font-bold text-white"
          >
            Download All
          </button>
        </div>
        <!-- Existing Pagination Controls -->
        <div class="flex pt-5 mx-auto w-fit items-center space-x-2">
          <button
            class="px-4 py-4 bg-[#914f8f] rounded-md outline-none relative overflow-hidden border duration-300 ease-linear
        after:absolute after:inset-x-0 after:aspect-square after:scale-0 after:opacity-70 after:origin-center after:duration-300 after:ease-linear after:rounded-full after:top-0 after:left-0 after:bg-[#172554]
       text-base border-transparent relative bg-gray-500 min-w-max font-bold text-white"
            disabled
          >
            Prev
          </button>
  
          <input
            type="text"
            pattern="\d*"
            class="text-center w-12"
            placeholder="0"
          />
  
          <span>of {totalPages}</span>
  
          <button
            class="px-4 py-4 bg-[#914f8f] rounded-md outline-none relative overflow-hidden border duration-300 ease-linear
        after:absolute after:inset-x-0 after:aspect-square after:scale-0 after:opacity-70 after:origin-center after:duration-300 after:ease-linear after:rounded-full after:top-0 after:left-0 after:bg-[#172554]
       text-base border-transparent relative bg-gray-500 text-white"
            disabled
          >
            Next
          </button>
        </div>
      </div>
    {/if}
    <div class="relative overflow-hidden dark:bg-slate-800/25">
      {#if $files.length}
        <div class="snap-x overflow-x-auto mt-4 flex gap-5">
          {#each paginatedFiles as file (currentPage + file.id)}
            <div
              in:fly={{ x: 20, duration: 300 }}
              class="snap-start rounded-lg shadow-lg mt-5 md:mt-12 bg-white dark:bg-gray-900 relative transition duration-200 ease-in-out"
            >
              {#if file.after}
                <div
                  class="absolute z-50 top-0 right-0 p-2 text-sm text-gray-700 bg-opacity-50 bg-white dark:text-gray-300 dark:bg-gray-800 rounded-bl-md"
                >
                  {(atob(file.after.split(",")[1]).length / 1024 / 1024).toFixed(
                    2,
                  )}
                  MB
                </div>
  
                <!-- Gambar -->
  
                {#if file.loading}
                  <!-- Loader displayed while the file is being processed -->
                  <div
                    class="loader i-tabler-loader-3 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent"
                  />
                {:else}
                  <!-- Image preview displayed once the file processing is complete -->
                  <div
                    class="aspect-square h-45 w-45 bg-cover bg-center rounded-lg overflow-hidden"
                  >
                    <img
                      src={file.previewUrl}
                      alt="Gambar"
                      class="object-cover w-full h-full rounded-lg"
                    />
                    <a
                      href={file.after}
                      download={file.newFileName}
                      class="absolute inset-0 flex items-center justify-center"
                      title="Download file"
                    >
                      <div
                        class="flex items-center justify-center cursor-pointer"
                      >
                        <div
                          class="bg-white bg-opacity-70 hover:bg-opacity-80 rounded-full p-3 transition duration-300 ease-in-out"
                        >
                          <div
                            class="i-tabler-download h-12 w-12 text-white bg-red-500 rounded-full hover:bg-red-700 dark:hover:bg-red-600 transition duration-300 ease-in-out flex items-center justify-center cursor-pointer"
                          />
                        </div>
                      </div>
                    </a>
                  </div>
                {/if}
                <!-- Tombol Hapus -->
                <div
                  class="i-fluent-emoji-cross-mark-button hover:text-lg absolute bottom-0 right-0 text-md bg-white rouded-sm text-white transition duration-300 ease-in-out"
                  on:click={() => removeFile(file.id)}
                />
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <div class="rounded-md">
          <h2>Hasilnya akan muncul disini</h2>
          <div class="w-full flex gap-8 snap-x scroll-pl-6 overflow-x-auto py-14">
            {#each Array(4) as _, index (index)}
              <!-- Anggap ada maksimal 5 file -->
              <div
                class="animate-pulse shadow-lg snap-start p-24 h-auto w-48 bg-gray-300 rounded-md"
              ></div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
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
    input[type="text"] {
      border: 1px solid #ddd;
      padding: 0.4rem;
      border-radius: var(--border-radius);
      text-align: center;
      transition: border-color 0.3s;
      font-family: var(--font-family);
    }
  
    input[type="text"]:focus {
      border-color: var(--primary-color);
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
  