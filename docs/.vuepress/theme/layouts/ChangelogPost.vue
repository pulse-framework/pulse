<template>
    <div>
        <Nav style="background: linear-gradient(45deg, #064789 0%, #427aa1 100%)"/>
        <div class="container mx-auto my-10 py-10 px-20 rounded border shadow-xl" style="width: 100%">
            <!-- Main Content -->
            <Content class="change-content"/>
        </div>
        <Footer />
    </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css?family=Noto+Sans&display=swap');

.change-content > h1, h2, h3, h4, h5 {
    border-left-width: 5px;
    border-color: #38b2ac;
    font-size: 1.25rem;
    padding-left: 15px;
    margin-top: 10px;
    margin-bottom: 15px;
}

</style>

<script>
import Nav from '@theme/components/Nav';
import Footer from '@theme/components/Footer';
export default {
    components: { 
        Nav,
        Footer,
    },
}
</script>