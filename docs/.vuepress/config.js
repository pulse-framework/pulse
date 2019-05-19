module.exports = {
	title: 'PulseJS',
	description: 'Application logic library for reactive Javascript frameworks',
	dest: "dist",
	serviceWorker: true,
	themeConfig: {
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Guide', link: '/guide.md' }
		],
		lastUpdated: 'Last Updated',
		// Assumes GitHub. Can also be a full GitLab url.
		repo: 'jamiepine/pulse',
		// Customising the header label
		// Defaults to "GitHub"/"GitLab"/"Bitbucket" depending on `themeConfig.repo`
		repoLabel: 'Contribute!',
		// if your docs are not at the root of the repo:
		docsDir: 'docs',
		// if your docs are in a specific branch (defaults to 'master'):
		docsBranch: 'master',
		// defaults to false, set to true to enable
		editLinks: true,
		// custom text for edit link. Defaults to "Edit this page"
		editLinkText: 'Help us improve this page!',
		serviceWorker: {
			updatePopup: true
		}
	}
}
