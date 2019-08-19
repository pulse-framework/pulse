<template>
    <div class="h-screen">
        <!-- index.html -->
        <div style="background: linear-gradient(90deg, #064789 0%, #427aa1 100%)">
            <Nav class="container mx-auto"/>
            <div class="container mx-auto px-6 text-center p-10">
                <h1 class="text-4xl font-bold mb-2 text-white border-l-0">
                    PulseJS
                </h1>
                <div class="container mx-auto">
                    <a href="/introduction/what-is-pulse"><div class="text-gray text-center bg-white px-4 py-2 m-2 rounded-full">Get Started</div></a>
                    <div class="text-gray text-center bg-white px-4 py-2 m-2 rounded"><pre>npm install pulse-framework</pre></div>
                </div>

                <h3 class="text-2xl mb-8 text-white border-l-0">
                The framework that works hard so you dont have to!
                </h3>
                <button class="bg-white font-bold rounded py-4 px-8 shadow-lg uppercase tracking-wider mb-10">
                Get Started
                </button>
            </div>
        </div>
        <div class="px-8 py-4 font-sans bg-gray-700 leading-loose container mx-auto front-content">
            <Content />
        </div>
        <Footer />
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Noto+Sans&display=swap');
.front-content {
    height: 55vh;
    font-family: 'Noto Sans', sans-serif;
}
</style>

<script>
import Nav from '../components/Nav';
import Footer from '../components/Footer';
export default {
    components: { 
        Nav,
        Footer,
    },
}

</script>