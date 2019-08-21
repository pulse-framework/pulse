<template>
    <div class="wrapper">
        <div style="background: linear-gradient(90deg, #064789 0%, #427aa1 100%)">
            <Nav class="container mx-auto"/>
            <Hero title="PulseJS" tagline="" />
        </div>
        <!-- Feature DIV -->
        <div class="container mx-auto flex px-8 py-4 font-sans leading-loose front-content text-center">
            <!-- Features here with FeatureCard component -->
            <FeatureCard class="flex-1 overflow-y-auto" title="State Management" tagline="Drop in replacement for Vuex and Redux" />
            <FeatureCard class="flex-1 overflow-y-auto" title="Low Footprint" tagline="The minified library is only 40kb keeping your load times minimal." />
            <FeatureCard class="flex-1 overflow-y-auto" title="Accessible" tagline="An easy to understand library that will have you up and running in minutes." />
        </div>
        <div class="push"></div>

        <!-- End Feature DIV -->
        <Footer />
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Noto+Sans&display=swap');
.front-content {
    font-family: 'Noto Sans', sans-serif;
}
</style>

<script>
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import FeatureCard from '../components/FeatureCard';
import Hero from '../components/Hero';
export default {
    components: { 
        Nav,
        Footer,
        FeatureCard,
        Hero,
    },
}
</script>