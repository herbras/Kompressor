<script>
    import { wrap } from "comlink";
    import { writable } from "svelte/store";
    import Worker from "./worker/worker?worker";
    import { set, del, keys } from "idb-keyval";
    import JSZip from "jszip";
  
    let files = writable([]);
    let loading = writable(false);
    const worker = wrap(new Worker());
  
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
  
      const newFilePromises = newFiles.map(async (newFile) => {
        let fileName = newFile.name;
        let duplicateCount = 0;
        const splitName = fileName.split(".");
        let baseName = splitName.slice(0, -1).join(".");
        let extension = splitName[splitName.length - 1];
        baseName += "-sarbeh";
  
        while (existingKeys.includes(`${baseName}${duplicateCount > 0 ? "-" + duplicateCount : ""}.${extension}`)) {
          duplicateCount++;
        }
  
        fileName = `${baseName}${duplicateCount > 0 ? "-" + duplicateCount : ""}.${extension}`;
  
        const compressedFileBlob = await worker.compressImage(newFile);
        const base64 = await fileToBase64(compressedFileBlob);
  
        files.update((currentFiles) => {
          return [...currentFiles, {
            before: newFile,
            newFileName: fileName,
            after: base64,
          }];
        });
  
        await set(fileName, base64);
  
        return {
          before: newFile,
          newFileName: fileName,
          after: base64,
        };
      });
  
      const newFilesData = await Promise.all(newFilePromises);
      files.update((currentFiles) => [...currentFiles, ...newFilesData]);
      loading.set(false);
    };
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
  
    function removeFile(fileName) {
      files.update((currentFiles) =>
        currentFiles.filter((file) => file.newFileName !== fileName)
      );
    }
  </script>
  
  <svelte:window on:paste={(e) => processFiles([...e.clipboardData?.files])} />
  
  <main
    class="flex flex-col items-center justify-center min-h-screen py-2 bg-blue-200" on:dragover={(e) => e.preventDefault()}
    on:drop={(e) => {
      e.preventDefault();
      console.log("Dropped:", e.dataTransfer.files); 
      processFiles([...e.dataTransfer.files]);
    }}
  >
    <form class="p-6 space-y-4 bg-white rounded-lg shadow-md">
      <label
        class="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <!-- SVG code... -->
        </svg>
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
  
    <p class="mt-4 text-center">
      Alternatively, paste an image from your clipboard.
    </p>
  
    {#if $files.length}
      <ul
        class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
       
      >
        {#each $files as file (file.newFileName)}
          <li
         
            class="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200 relative"
          >
            <button
              on:click={() => removeFile(file.newFileName)}
              class="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center"
            >
              X
            </button>
            <div class="w-full flex items-center justify-between p-6 space-x-6">
              <div class="flex-1 truncate">
                <div class="flex items-center space-x-3">
                  <h3 class="text-gray-900 text-md leading-6 truncate">
                    {file.newFileName}
                  </h3>
                </div>
                <p class="mt-2 text-gray-500 text-md leading-6">
                  Original size: {(file.before.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p class="mt-2 text-gray-500 text-md leading-6">
                  Compressed size: {(
                    atob(file.after.split(",")[1]).length /
                    1024 /
                    1024
                  ).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div class="p-4">
              <div class="flex divide-x divide-gray-200">
                <div class="flex-1 flex">
                  <a
                  href={file.after}
                  download={file.newFileName}
                  class="relative w-full inline-flex items-center justify-center py-2 text-sm text-gray-700 font-medium border border-transparent rounded hover:text-gray-500"
                >
                  Download compressed image
                </a>
                </div>
              </div>
            </div>
          </li>
        {/each}
      </ul>
      <button
        on:click={downloadAll}
        class="mt-4 py-2 px-4 bg-blue-500 text-white rounded"
        >Download All Images as ZIP</button
      >
    {/if}
  
    {#if $loading}
      <div
        class="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50"
      >
        <div class="flex flex-col items-center bg-white p-4 rounded-md shadow-lg">
          <img
            src="https://media1.tenor.com/images/d6cd5151c04765d1992edfde14483068/tenor.gif?itemid=5662595"
            alt="Loading..."
            class="w-32 h-32 mb-4"
          />
          <p class="text-lg font-semibold">
            Please wait, how many times spin.....
          </p>
        </div>
      </div>
    {/if}
  </main>
  