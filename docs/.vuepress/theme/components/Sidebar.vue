<template>
<nav class="side-container m-0 text-left px-10">
  <ul class="text-white p-0 list-none">
    <li v-for="item in $site.themeConfig.sidebar" class=" no-underline whitespace-no-wrap pt-8">
      <span
        class="text-white border-l-4 border-transparent hover:border-blue-800 pl-4 px-2"
      >{{item.text}}</span>
      <ul class="list-none">
        <li v-for="child in item.children" class="no-underline whitespace-no-wrap">
        <router-link
          :to="child.link"
          class="text-white border-transparent  border-l-4 hover:border-blue-800 pl-12"
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
