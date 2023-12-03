<script>
  import { files,isInputInvalid,downloadAll, totalPages, removeAllFiles, currentPage } from "./store.js";
  let inputPage 

  function changePage(newPage) {
  const page = parseInt(newPage);
  if (!isNaN(page) && page >= 1 && page <= $totalPages) {
    currentPage.set(page); // Correct way to update the store
    inputPage = ""; // Clear the input field
    isInputInvalid.set(false); // Use set method to update writable store
  } else {
    isInputInvalid.set(true); // Use set method to update writable store
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
      class:disabled-button={$currentPage === 1}
      on:click={() => changePage($currentPage - 1)}
      
    >
      Prev
    </button>

    <input
      type="text"
      bind:value={inputPage}
      on:keydown={handlePageInput}
      class="text-center w-12"
      placeholder={$currentPage}
    />

    <span>of {$totalPages}</span>

    <button
      class="px-4 py-4 bg-[#914f8f] rounded-md outline-none relative overflow-hidden border duration-300 ease-linear
after:absolute after:inset-x-0 after:aspect-square after:scale-0 after:opacity-70 after:origin-center after:duration-300 after:ease-linear after:rounded-full after:top-0 after:left-0 after:bg-[#172554]
text-base border-transparent relative bg-gradient-to-r from-[#6dd47e] to-[#31bdc6] dark:from-[#4CAF50] dark:to-[#087f23] hover:from-[rgba(109,212,126,0.8)] hover:to-[rgba(49,189,198,0.8)] focus:ring focus:ring-[#6dd47e] focus:ring-opacity-50 active:from-[rgba(49,189,198,0.8)] active:to-[rgba(109,212,126,0.8)] hover:after:opacity-100 hover:after:scale-[2.5] min-w-max font-bold text-white"
      class:disabled-button={currentPage >= $totalPages}
      on:click={() => changePage($currentPage + 1)}
      >
      Next
    </button>
  </div>

{#if $isInputInvalid}
  <div class="mt-3 text-center text-red-600 font-semibold">
    Maaf, filemu hanya sampai di total {$totalPages} halaman.
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

    <span>of {$totalPages}</span>

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
