<template>
<div class="side-container m-0 text-left pt-5">
  <ul class="text-white p-0 list-none pl-6 pr-16">
    <li v-for="item in $site.themeConfig.sidebar" class=" no-underline whitespace-no-wrap p-1">
      <a
        :href="item.link"
        class="text-white"
      >{{item.text}}</a>
      <ul class="block w-full p-0 list-none">
        <li v-for="child in item.children" class="no-underline pl-6 whitespace-no-wrap p-1">
        - <a
          :href="child.link"
          class="text-white hover:text-yellow"
        >{{ child.title }}</a>
        </li>
      </ul>
    </li>
  </ul>
</div>

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
