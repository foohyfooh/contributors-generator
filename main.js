const request = require('request-promise-native');
const fs = require('fs');
const process = require('process');
const args = process.argv.slice(2);

if(args.length < 2){
  console.error('Pass the owner and repo to the script');
  process.exit(0);
}

let owner = args[0];
let repo = args[1];

function createRequestOptions(uri){
  return {
    uri: uri,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0'
    },
    json: true
  };
}

(async () => {
  try{
    let requestOptions = createRequestOptions(`https://api.github.com/repos/${owner}/${repo}/stats/contributors`);
    let contributorData = await request(requestOptions);
    let contributors = await extractContributors(contributorData);
    contributors.sort((a, b) => b.contributions - a.contributions);
    generatorContributorsFile(contributors);
  }catch(e){
    console.error(e);
  }
})();

async function getContributorName(username){
  let requestOptions = createRequestOptions(`https://api.github.com/users/${username}`);
  let response = await request(requestOptions);
  return response.name ? response.name : username;
}

async function extractContributors(data){
  let contributors = [];
  for(let contributor of data){
    contributors.push({
      username: contributor.author.login,
      name: await getContributorName(contributor.author.login),
      link: contributor.author.html_url,
      icon: contributor.author.avatar_url,
      contributions: contributor.total
    });
  }
  return contributors;
}

function generatorContributorsFile(contributors){
  let contributorFileContents = '# Contributors\n\n<table><thead><th></th><th></th></thead><tbody>';
  for(let contributor of contributors){
    contributorFileContents +=  `
    <tr>
      <td>
      <p>${contributor.name} (<a href="${contributor.link}">${contributor.username}</a>)</p>
      <img src="${contributor.icon}" alt="${contributor.name} icon"  width="100px" height="100px">
      </td>
      <td style="vertical-align: top">
        <p>Number of Commits: ${contributor.contributions}</p>
        <p>Notable Contributions:</p>
        <ul>
          <li>
            None Yet
          </li>
        </ul>
      </td>
    </tr>`;
  }
  contributorFileContents += '</table>';
  fs.writeFileSync('contributors.md', contributorFileContents, {encoding: 'utf8'});
}
