<template>
    <div class="wrapper">
        <Nav style="background: linear-gradient(45deg, #064789 0%, #427aa1 100%)"/>
        <div class="container mx-auto flex font-sans leading-loose">
            <div class="flex-auto px-auto">
                <!-- Sidebar generator -->
                <Sidebar class="text-black" style="font-family: 'Noto Sans', sans-serif;"/>
            </div>
            <div class="flex-auto ml-16 pr-20 pb-16 pt-16" style="width: 100%">
                <!-- Main Content -->
                <Content class="guide-content" />
            </div>
        </div>
        <Footer />
    </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css?family=Noto+Sans&display=swap');

<<<<<<< Updated upstream
.guide-content > h2, h3 {
    border-left-width: 5px;
    border-color: #38b2ac;
    font-size: 1.25rem;
=======
h2, h3 {
    @apply border-l-4 border-teal-600;
    
>>>>>>> Stashed changes
    padding-left: 15px;
    margin-top: 10px;
    margin-bottom: 15px;
}
<<<<<<< Updated upstream
=======
.guide-content > h1 {
     
}
>>>>>>> Stashed changes
.header-anchor {
    @apply font-semibold text-teal-800;
}
tr, th, td {
    @apply border text-center px-2 py-1;
}
</style>

<script>
import Sidebar from '@theme/components/Sidebar'
import Nav from '@theme/components/Nav';
import Footer from '@theme/components/Footer';
export default {
    components: { 
        Nav,
        Sidebar,
        Footer,
    },
}
</script>