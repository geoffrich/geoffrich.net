const EleventyFetch = require('@11ty/eleventy-fetch');

module.exports = async function() {
  console.log('Fetching Svelte PRs...');

  const org = 'sveltejs';
  const state = 'closed';
  const author = 'geoffrich';

  return EleventyFetch(
    `https://api.github.com/search/issues?q=state%3A${state}+author%3A${author}+type%3Apr+user%3A${org}&per_page=100`,
    {
      duration: '1d',
      type: 'json'
    }
  ).then(json => {
    return {
      prs: json.items.map(({html_url, title, repository_url, created_at}) => ({
        url: html_url,
        title,
        repository_url,
        created_at
      }))
    };
  });
};
