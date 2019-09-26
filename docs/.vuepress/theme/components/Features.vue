<template>
	<!-- START Feature DIV -->
	<div id="features" class="container mx-auto flex px-8 my-10 py-4 font-sans leading-loose front-content text-center border-b-1">
		<!-- Features here with FeatureCard component -->
		<FeatureCard class="flex-1 overflow-y-auto" title="State Management" tagline="Drop in replacement for Vuex and Redux" />
		<FeatureCard class="flex-1 overflow-y-auto" title="Low Footprint" tagline="The minified library is only 40kb keeping your load times minimal." />
		<FeatureCard class="flex-1 overflow-y-auto" title="Accessible" tagline="An easy to understand library that will have you up and running in minutes." />
	</div>
</template>

<script>
import FeatureCard from '@theme/components/FeatureCard';

export default {
	components: {
		FeatureCard,
	}
}
</script>