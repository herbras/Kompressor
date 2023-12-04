<main
  class=" p-5 rounded-3xl bg-blue-200 relative"
 
>
  <div
    class="flex items-center justify-center z-20 p-2 absolute top-8 right-6 bg-blue-600 rounded-full shadow-lg transition"
  >
   
    <span class="mr-3 text-gray-100 font-medium text-lg">
    "WEBP" : "JPG"
    </span>

    <label
      for="formatToggle"
      class="relative h-8 w-14 cursor-pointer [-webkit-tap-highlight-color:_transparent] block"
    >
      <input
        type="checkbox"
        id="formatToggle"
        class="sr-only"
      />
      <span
        class="absolute inset-0 rounded-full transition duration-300"

      ></span>
      <span
        class="absolute inset-y-0 m-1 h-6 w-6 rounded-full transition-all duration-300"
     
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
        class="hidden"
      />
    </label>
  </form>
</main>