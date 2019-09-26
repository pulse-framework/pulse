<template>
    <div class="container mx-auto px-6 text-center pb-5">
        <h1 class="text-4xl font-bold mb-2 text-white border-l-0">
            PulseJS
        </h1>
        <h2 class="text-2xl mb-8 text-white border-l-0">
            Application logic library for reactive Javascript frameworks
        </h2>
        <div class="container mx-auto flex items-center justify-center">
            <div class="text-gray text-center bg-white px-4 py-2 m-2 mb-6 rounded"><pre>npm install pulse-framework</pre></div>
        </div>
        <div class="container mx-auto flex items-center justify-center">
            <div class="bg-white font-bold rounded py-4 px-8 shadow-lg uppercase tracking-wider mb-2"><a href="/introduction/what-is-pulse.html">Get Started</a></div>
        </div>
    </div>
</template>
<style scoped>
    h2 {
        padding-bottom: 30px;
    }
</style>
<script>
export default {
    props: {
        title: { required: true },
        tagline: { default: 'tagline' },
    }
}
</script>