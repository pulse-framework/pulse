<template>
<div class="container mx-auto">
    <div v-for="post in posts" class="rounded border shadow-lg p-10 m-6 inline-block">
        <h2 class="text-2xl font-bold">
            <router-link :to="post.path"># {{ post.frontmatter.title }}</router-link>
        </h2>
        <pre class="pb-4">Posted on: {{ formatDate(post.frontmatter.date) }}</pre>
        
        <p class="border-l-4 border-teal-300 px-4">{{ post.frontmatter.description }}</p>

        <p class="mt-8"><router-link :to="post.path" class="bg-blue-600 text-white font-bold px-5 py-3 rounded shadow-md">Read more</router-link></p>
    </div>
</div> 
</template>

<script>
export default {
    computed: {
        posts() {
            return this.$site.pages
                .filter(x => x.path.startsWith('/changelog/') && !x.frontmatter.changelog_index)
                .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date));
        },
    },
    methods: {
        formatDate(date) {
            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;

            return [year, month, day].join('-');
        }
    }
}
</script>