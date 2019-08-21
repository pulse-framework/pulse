<template>
    <div class="h-screen">
        <!-- index.html -->
        <div style="background: linear-gradient(90deg, #064789 0%, #427aa1 100%)">
            <Nav class="container mx-auto"/>
        </div>
        <div class="px-8 py-4 font-sans bg-gray-700 leading-loose container mx-auto front-content">
            <Content />
        </div>
        <Footer />
    </div>
</template>

<script>
export default {
    computed: {
        posts() {
            return this.$site.pages
                .filter(x => x.path.startsWith('/changelog/') && !x.frontmatter.blog_index)
                .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date));
        }
    }
}
</script>