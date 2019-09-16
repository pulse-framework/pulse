<template>
    <div class="wrapper">
        <div style="background: linear-gradient(90deg, #064789 0%, #427aa1 100%)">
            <Header class="container mx-auto"/>
            <Hero title="PulseJS"/>
        </div>
        <div>
            <Features />
        </div>
        <Footer />
    </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css?family=Noto+Sans&display=swap');
.front-content {
    font-family: 'Noto Sans', sans-serif;
}
</style>

<script>
import Header from '@theme/components/Header';
import Footer from '@theme/components/Footer';
import Features from '@theme/components/Features';
import Hero from '@theme/components/Hero';

export default {
    components: { 
        Header,
        Footer,
        Features,
        Hero,
    },
}
</script>