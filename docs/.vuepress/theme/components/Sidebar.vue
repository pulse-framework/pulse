<template>
<nav class="side-container m-0 text-left pt-5">
  <ul class="text-white p-0 list-none w-full pl-10">
    <li v-for="item in $site.themeConfig.sidebar" class=" no-underline whitespace-no-wrap">
      <p
        class="text-white pl-6 pr-16 w-full h-full"
      >{{item.text}}</p>
      <ul class="block w-full p-0 list-none font-medium">
        <li v-for="child in item.children" class="no-underline pl-6 pr-16 whitespace-no-wrap">
        <router-link
          :to="child.link"
          class="text-white pl-6 hover:text-teal-300 hover:underline"
        >- {{ child.title }}</router-link>
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
