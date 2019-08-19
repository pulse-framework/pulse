<template>
    <div>
        <Nav style="background: linear-gradient(45deg, #064789 0%, #427aa1 100%)"/>
        <div class="flex font-sans leading-loose text-lg text-grey-darkest">
            <div class="bg-black flex-auto px-auto">
                <Sidebar style="font-family: 'Noto Sans', sans-serif;"/>
            </div>
            <div class="flex-auto ml-20" style="width: 75vw">
                <!-- Main Content -->
                <Content />
            </div>
        </div>
        <Footer />
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Noto+Sans&display=swap');

body, html, #app {
  height: 100%; /* makes the footer sticked to bottom */
  /* font-family: 'Noto Sans', sans-serif; */
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