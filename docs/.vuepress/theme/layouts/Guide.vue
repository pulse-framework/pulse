<template>
    <div>
        <Nav style="background: linear-gradient(45deg, #064789 0%, #427aa1 100%)"/>
        <div class="flex font-sans leading-loose text-lg text-grey-900">
            <div class="bg-black flex-auto px-auto">
                <!-- Sidebar generator -->
                <Sidebar style="font-family: 'Noto Sans', sans-serif;"/>
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

body, html, #app {
  height: 100%; /* makes the footer sticked to bottom */
  /* font-family: 'Noto Sans', sans-serif; */
}
.guide-content > h2, h3 {
    border-left-width: 5px;
    border-color: #38b2ac;
    font-size: 1.25rem;
    padding-left: 15px;
    margin-top: 10px;
    margin-bottom: 15px;
}
h2 > header-anchor {
    color: #b2f5ea;
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