<script>
        import { onDestroy } from "svelte";
        import { writable } from "svelte/store";

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
  const byteUnits = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  
  $: totalFilesConverted = $sseData.totalFilesConverted;
  $: totalSizeConverted = $sseData.totalSizeConverted;
  $: sizeUnit = Math.floor(Math.log(totalSizeConverted) / Math.log(1024));
  $: totalSizeFormatted = (totalSizeConverted / Math.pow(1024, sizeUnit)).toFixed(2);
  $: sizeLabel = byteUnits[sizeUnit];
</script>
  
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