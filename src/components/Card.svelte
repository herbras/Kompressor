<script>
    import { files, paginatedFiles, removeFile, currentPage } from './store.js';
    import { fly } from "svelte/transition";

</script>
<div class="relative overflow-hidden dark:bg-slate-800/25">
    {#if $files.length}
      <div class="snap-x overflow-x-auto mt-4 flex gap-5">
        {#each $paginatedFiles as file ($currentPage + file.id)}
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


              {#if file.loading}
                <div
                  class="loader i-tabler-loader-3 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent"
                />
              {:else}
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
        <div class="w-full flex gap-8 snap-x scroll-pl-6 overflow-x-auto ">
          {#each Array(4) as _, index (index)}
            <div
              class="animate-pulse shadow-lg snap-start p-24 h-auto w-48 bg-gray-300 rounded-md"
            ></div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
