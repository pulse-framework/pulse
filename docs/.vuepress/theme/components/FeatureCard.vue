<template>
    <div class="shadow-lg p-6 m-2 card border">
        <!-- <img class="w-full" :src="`${image}`" alt="cute kitty"> -->
        <div class="px-6 py-4 overflow-auto">
            <div class="font-bold text-xl mb-2" v-text="title"></div>
            <p class="text-gray-700 text-base" v-text="tagline"></p>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        title: { required: true },
        tagline: { default: 'tagline' },
       //image: { default: 'https://placekitten.com/300/300' }
    },
    // data: function () {
    //     return {
    //         image: image
    //     }
    // }
}
</script>