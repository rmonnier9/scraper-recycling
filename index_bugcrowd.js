const { csvFormat } = require('d3-dsv');
const Nightmare = require('nightmare');
const { writeFileSync } = require('fs');

const SHOW = false;

const getCompanyList = async () => {
  const START = 'https://www.bugcrowd.com/bug-bounty-list/';
  console.log(`Now gathering companies.`);
  const nightmare = new Nightmare({
    show: SHOW,
    waitTimeout: 4000,
  });
  try {
    const result = await nightmare
      .goto(START)
      .wait('.unstriped tbody tr')
      .evaluate(() => {
        return [...document.querySelectorAll('.unstriped tbody tr')]
          .map(el => ({
            name: el.childNodes[1].childNodes[0].text,
            url: el.childNodes[1].childNodes[0].href,
          }));
      })
      .end();
    return result;
  } catch(e) {
    console.error(e);
    return undefined;
  }
}

const getCompanyDomainBugCrowd = async (url) => {
  const nightmare = new Nightmare({
    show: SHOW,
    waitTimeout: 4000,
  });
  try {
    const result = await nightmare
      .goto(url)
      .wait('.bc-grid')
      .evaluate(() => {
        output = { description: '', domains: [] };
        output.domains = [...document.querySelectorAll('.bc-target a')].map(el => (el.href));

        element = document.querySelector('.bounty-header-text p')
        if (element) {
          output.description = element.firstChild.nodeValue;
        }
        return output;
      })
      .end();
    return result;
  } catch(e) {
    console.error(e);
    return { domains: [], description: '' };
  }
}

const getCompanyDomainHackerOne = async (url) => {
  const nightmare = new Nightmare({
    show: SHOW,
    waitTimeout: 4000,
  });
  try {
    const result = await nightmare
      .goto(url)
      .wait('.profile-header__container')
      .evaluate(() => {
        output = { description: '', domains: [], infos: [] };
        output.infos = [...document.querySelectorAll('.profile-header__information__item')].map(el => (el.innerText));

        let element;
        element = document.querySelector('.profile-header__bio')
        if (element) {
          output.description = element.firstChild.nodeValue;
        }
        element = document.querySelector('.profile-header__link.spec-link')
        if (element) {
          output.domains = [document.querySelector('.profile-header__link.spec-link').firstChild.nodeValue];
        }

        return output;
      })
      .end();
    return result;
  } catch(e) {
    console.error(e);
    return { domains: [], description: '', infos: [] };
  }
}


const pipeline = async () => {
  let list = await getCompanyList();

  list = await list.reduce(async (queue, elem) => {
    const dataArray = await queue;
    const { url } = elem;
    const newElem = {...elem};
    console.log(elem);
    if (!url) { return dataArray; }

    if (url.match(/bugcrowd\.com/)) {
      const { domains, description } = await getCompanyDomainBugCrowd(url);
      newElem.domains = domains;
      newElem.description = description;
    } else if (url.match(/hackerone\.com/)) {
      const { domains, description, infos } = await getCompanyDomainHackerOne(url);
      newElem.domains = domains;
      newElem.description = description;
      newElem.infos = infos;
    } else if (url.match(/cobalt\.io/)) {
      newElem.domains = [];
      newElem.description = '';
    } else {
      newElem.domains = [url];
      newElem.description = '';
    }
    dataArray.push(newElem);
    console.log(newElem)
    return dataArray;
  }, Promise.resolve([]));

  const csvData = csvFormat(list.filter(i => i));
  writeFileSync('./output.csv', csvData, { encoding: 'utf8' });

}

pipeline();

// const series = numbers.reduce(async (queue, number) => {
//   const dataArray = await queue;
//   dataArray.push(await getAddress(number));
//   return dataArray;
// }, Promise.resolve([]));
//
// series.then(data => {
//   const csvData = csvFormat(data.filter(i => i));
//   writeFileSync('./output.csv', csvData, { encoding: 'utf8' });
// })
// .catch(e => console.error(e));
