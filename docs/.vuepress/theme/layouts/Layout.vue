<template>
    <div class="wrapper">
        <div style="background: linear-gradient(90deg, #064789 0%, #427aa1 100%)">
            <Nav class="container mx-auto"/>
            <Hero title="PulseJS" tagline=""/>
        </div>
        <!-- START Feature DIV -->
        <div class="container mx-auto flex px-8 my-10 py-4 font-sans leading-loose front-content text-center border-b-1">
            <!-- Features here with FeatureCard component -->
            <FeatureCard class="flex-1 overflow-y-auto" title="State Management" tagline="Drop in replacement for Vuex and Redux" />
            <FeatureCard class="flex-1 overflow-y-auto" title="Low Footprint" tagline="The minified library is only 40kb keeping your load times minimal." />
            <FeatureCard class="flex-1 overflow-y-auto" title="Accessible" tagline="An easy to understand library that will have you up and running in minutes." />
        </div>
        
        <!-- END Feature DIV -->
        <!-- <div class="text-3xl text-center text-blue-400">Team</div> -->
        <!-- START Team DIV -->
        <!-- <div class="container mx-auto flex-wrap px-8 py-4 font-sans leading-loose front-content text-center">
            <div class="flex-1 overflow-y-auto inline-block" v-for="data in teamMembers">
                <TeamCard 
                :name="data.author.login" 
                :image="data.author.avatar_url"
                :link="data.author.html_url"
                :commits="data.total"
                />
            </div>
        </div> -->
        <!-- END Team DIV -->
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
        <div>

        </div>
        <Footer />
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Noto+Sans&display=swap');
.front-content {
    font-family: 'Noto Sans', sans-serif;
}
</style>

<script>
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import TeamCard from '../components/TeamCard';
import FeatureCard from '../components/FeatureCard';
import Hero from '../components/Hero';
import axios from'../../../../node_modules/axios';

export default {
    components: { 
        Nav,
        Footer,
        FeatureCard,
        TeamCard,
        Hero,
    },
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
    // WIP
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