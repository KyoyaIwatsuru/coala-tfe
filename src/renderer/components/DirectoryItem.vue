<template>
  <li v-if="isFolder && open">
    <span @click="toggle" class="folder"><i class="twa twa-open-file-folder"></i> {{model.name}}</span>
    <ul>
      <directory-item v-for="(m, i) in model.children" :key="i" :model="m"></directory-item>
    </ul>
  </li>
  <li v-else-if="isFolder && !open">
    <span @click="toggle" class="folder"><i class="twa twa-file-folder"></i> {{model.name}}</span>
  </li>
  <li v-else>
    <router-link :to="{ name: 'question', params: {fileName: model.path, questionId: 0} }"><i class="twa twa-page-facing-up"></i> {{ model.name }}</router-link>
  </li>
</template>

<script>
  export default {
    name: 'DirectoryItem',
    props: ['model'],
    data () {
      return {
        open: false
      }
    },
    computed: {
      isFolder: function () {
        return this.model.children && this.model.children.length
      }
    },
    methods: {
      toggle: function () {
        this.open = !this.open
      }
    }
  }
</script>

<style lang='scss'>
.folder {
  color: #007bff;

  &:hover {
    color: #0056b3;
    text-decoration: underline;
    cursor: pointer;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
