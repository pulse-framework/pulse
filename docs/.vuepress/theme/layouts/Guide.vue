<template>
    <div class="wrapper">
        <Header style="background: linear-gradient(45deg, #064789 0%, #427aa1 100%)"/>
        <div id="content" class="container mx-auto flex font-sans leading-loose">
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

<script>
import Sidebar from '@theme/components/Sidebar'
import Header from '@theme/components/Header';
import Footer from '@theme/components/Footer';
export default {
    components: { 
        Header,
        Sidebar,
        Footer,
    },
}
</script>