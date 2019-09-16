<template>
    <div class="wrapper">
        <Header style="background: linear-gradient(45deg, #064789 0%, #427aa1 100%)"/>
        <div class="font-sans leading-loose text-grey-900">
            <div class="ml-16 pr-20 pb-16 pt-16">
                <!-- Main Content -->
                <!-- <Content /> -->
                <ChangelogIndex />
            </div>
        </div>
        <Footer />
    </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css?family=Noto+Sans&display=swap');

body, html, #app {
  height: 100%; /* makes the footer sticked to bottom */
  font-family: 'Noto Sans', sans-serif;
}

</style>

<script>
import Header from '@theme/components/Header';
import ChangelogIndex from '@theme/components/ChangelogIndex';
import Footer from '@theme/components/Footer';
export default {
    components: { 
        Header,
        ChangelogIndex,
        Footer,
    },
}
</script>