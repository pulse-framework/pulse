<template>
  <nav class="side-container m-0 text-left px-10">
    <ul class="p-0 list-none">
      <li v-for="item in $site.themeConfig.sidebar" class=" no-underline whitespace-no-wrap pt-8">
        <span
          class="border-l-4 border-transparent hover:border-blue-800 pl-4 px-2"
        >{{item.text}}</span>
        <ul class="list-none">
          <li v-for="child in item.children" class="no-underline whitespace-no-wrap">
            <!-- if the current router path is the same as the page link clicked (plus .html), add the active class to that link -->
          <router-link
            :to="child.link"
            :class="{
              'active-link' : $route.fullPath === child.link + '.html'
              }"
            class="border-transparent border-l-4 hover:border-blue-800 pl-12"
          >{{ child.title }}</router-link>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style>
.side-container > li, ul{
  display: table;
  text-decoration: none;
  list-style-type: none;
}
a {
  text-decoration: none; 
}
</style>
