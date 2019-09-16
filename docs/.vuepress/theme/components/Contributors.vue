<template>
	<div>
	<div class="text-3xl text-center text-orange-600">Contributors</div>
        <!-- START Contributer DIV -->
        <div class="container mx-auto px-8 py-4 mb-10 font-sans leading-loose front-content text-center justify-center">
            <div class="flex-1 overflow-y-auto inline-block" v-for="contributor in ordersContributors(items.data)">
                <TeamCard 
                :name="contributor.author.login"
                :image="contributor.author.avatar_url"
                :link="contributor.author.html_url"
                :commits="contributor.total"
                />
            </div>
        </div>
	</div>
</template>

<script>
import TeamCard from '@theme/components/TeamCard'
export default {
	data(){
        return{
            items: [],
        }
    },
    methods: {
        ordersContributors: function (data){
            if(data != null){
                return data.slice().sort(function(a, b) {
                  return b.total - a.total;
                });
            };
        }
    },
    async beforeMount() {
        let url = 'https://api.github.com/repos/jamiepine/pulse/stats/contributors';
        try {
            this.$data.items = await axios.get(url);
        } catch (e) {
            return e
        }
    }
}
</script>