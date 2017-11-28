const Nightmare = require('nightmare');
const { csvFormatRows } = require('d3-dsv');
const { createWriteStream } = require('fs');

const SHOW = false;
const fields = ['name', 'domains', 'location', 'creation', 'effectif', 'bourse', 'description' ];

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

class SearchGoogle {
  constructor() {
    this.nightmare = new Nightmare({
      show: true,
      waitTimeout: 4000,
      // typeInterval: 500,
      // switches: {
      //   'proxy-server': 'free-sg.hide.me',
      //   'ignore-certificate-errors': true
      // }
    })
    // .useragent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
    // .authentication('bob75017', '1os')
    .goto('https://www.google.fr/');
    // http://useragentstring.com/
    // https://free-proxy-list.net/

    this.get = async (name) => {
      try {
        const result = await this.nightmare
          .wait('input[name="q"]')
          .type('input[name="q"]', name)
          .click('button[name="btnG"]')
          .wait('h3')
          .evaluate(() => {
            document.querySelector('input[name="q"]').value = '';
            output = { description: '' };
            const description = [...document.querySelectorAll('div#rhs_block > div > div > div > div > div > div > div > div > div > div > div > span')];
            if (description.length && description[0].innerText.length >= 10) {
              output.description = description[0].innerText;
            } else {
              output.description = document.querySelector('span.st').innerText
            }
            const infos = document.querySelectorAll('span:first-child:nth-last-child(2)');
            const findWithRegexp = (list, toFind) => {
              let output = '';
              list.forEach((elem) => {
                if (elem.innerText.match(new RegExp(toFind))) {
                  output = elem.nextSibling.innerText;
                }
              });
              return output;
            }
            output.location = findWithRegexp(infos, 'Siège social');
            output.effectif = findWithRegexp(infos, 'Effectif');
            output.creation = findWithRegexp(infos, 'Création');
            if (findWithRegexp(infos, 'Cours de l')) {
              output.bourse = 'Coté en bourse.';
            } else {
              output.bourse = '';
            }
            return output;
          })
        return result;
      } catch(e) {
        console.error(e);
        return { description: '', location: '', effectif: '', creation: '' };
      }
    }
  }
}

const pipeline = async () => {
  let list = await getCompanyList();

  const stream = createWriteStream('./output.csv');
  stream.write(fields.join(','));
  stream.write('\n');
  const searchGoogle = new SearchGoogle();
  let i = 0;
  list = await list.reduce(async (queue, elem) => {
    await queue;
    console.log(`${elem.name} is being processed.`);

    const { url } = elem;
    const newElem = {...elem};
    if (!url) { return true; }
    const infos = await searchGoogle.get(elem.name);
    newElem.location = infos.location;
    newElem.description = infos.description;
    newElem.effectif = infos.effectif;
    newElem.creation = infos.creation;
    if (url.match(/bugcrowd\.com/)) {
      const { domains, description } = await getCompanyDomainBugCrowd(url);
      newElem.domains = domains;
      newElem.description = description;
    } else if (url.match(/hackerone\.com/)) {
      newElem.domains = [];
    } else if (url.match(/cobalt\.io/)) {
      newElem.domains = [];
    } else {
      newElem.domains = [url];
    }
    console.log(newElem)
    const jsonToArray = [];
    fields.forEach((field) => { jsonToArray.push(newElem[field] || ''); });
    // console.log(jsonToArray);
    const csvData = csvFormatRows([jsonToArray]);
    stream.write(csvData);
    stream.write('\n');
    i += 1;
    return true;
  }, Promise.resolve([]));
  stream.end();
  console.log(`Done. ${i} rows written.`)
}

pipeline();

// const getCompanyDomainHackerOne = async (url) => {
//   const nightmare = new Nightmare({
//     show: SHOW,
//     waitTimeout: 4000,
//   });
//   try {
//     const result = await nightmare
//       .goto(url)
//       .wait('.profile-header__container')
//       .evaluate(() => {
//         output = { description: '', domains: [], infos: [] };
//         output.infos = [...document.querySelectorAll('.profile-header__information__item')].map(el => (el.innerText));
//
//         let element;
//         element = document.querySelector('.profile-header__bio')
//         if (element) {
//           output.description = element.firstChild.nodeValue;
//         }
//         element = document.querySelector('.profile-header__link.spec-link')
//         if (element) {
//           output.domains = [document.querySelector('.profile-header__link.spec-link').firstChild.nodeValue];
//         }
//
//         return output;
//       })
//       .end();
//     return result;
//   } catch(e) {
//     console.error(e);
//     return { domains: [], description: '', infos: [] };
//   }
// }
//
// class SearchCrunchbase {
//   constructor() {
//     this.nightmare = new Nightmare({
//       show: true,
//       waitTimeout: 4000,
//       typeInterval: 500,
//       switches: {
//         'proxy-server': 'free-sg.hide.me',
//         'ignore-certificate-errors': true
//       }
//     })
//     .useragent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
//     .authentication('bob75017', '1osiris1')
//     .goto('https://www.crunchbase.com/search/organization.companies');
//     // http://useragentstring.com/
//     // https://free-proxy-list.net/
//
//     this.get = async (name) => {
//       try {
//         const result = await this.nightmare
//           .wait('input[id="md-input-1"]')
//           .type('input[id="md-input-1"]', name)
//           .type('body', '\u000d')
//           .wait('.component--image-with-fields-card .field-row')
//           .evaluate(() => {
//             output = { description: '', location: '' };
//             const infos = [...document.querySelectorAll('.component--image-with-fields-card .field-row')].map(el => (el.innerText));
//             output.description = infos[1];
//             output.location = infos[2];
//             return output;
//           })
//         return result;
//       } catch(e) {
//         console.error(e);
//         return { description: '', location: '' };
//       }
//     }
//   }
// }
