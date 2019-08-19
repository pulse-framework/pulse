<template>
<header>
    <nav style="z-index: 99 !important;"
      class="mx-auto py-2 px-4 font-sans text-center flex justify-between static container"
    >
      <a
        href="/"
        class="text-left no-underline font-bold text-white uppercase py-3 px-3"
      >{{$site.title}}</a>
      <div>
        
        <ul class="text-m text-white list-reset flex items-center">
          <SearchBox  class="pt-1 text-left sm:mr-3"/>
          <li v-for="item in $site.themeConfig.nav">
            <a
              :href="item.link"
              class="inline-block py-4 px-3 text-white hover:text-grey-dark no-underline"
            >{{item.text}}</a>
          </li>
        </ul>
      </div>
    </nav>
</header>
</template>
<style scoped>
a:hover {
  color: #fffb1e;
}
</style>
<script>
import SearchBox from '@SearchBox'

export default {
  components: { SearchBox }
}

</script>