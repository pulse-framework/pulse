<template>
    <div class="shadow-lg p-6 m-2 card border rounded-lg hover:bg-blue-400">
        <a :href="link"><img class="w-16 rounded-full mx-auto" :src="`${image}`" alt="contributor"></a>
        <div class="px-6 py-4 overflow-auto">
            <a :href="link"><span class="font-bold text-xl mb-2" v-text="name"></span></a>
            <p class="text-gray-700 text-base" v-text="tagline"></p>
            <span>Commits: {{ commits }}</span>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        name: { required: true },
        tagline: { default: '' },
        image: { default: 'https://placekitten.com/300/300' },
        commits: { default: '1' },
        link: { default: '#' }
    },
    data: function () {
        return {
            image: image
        }
    }
}
</script>