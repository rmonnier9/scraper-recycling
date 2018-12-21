const Nightmare = require('nightmare');
const { csvFormatRows } = require('d3-dsv');
const { createWriteStream } = require('fs');

const SHOW = false;
const fields = ['name', 'url', 'mail', 'phone', 'contactName' ];

const getCompanyList = async () => {
  const START = 'http://www.guide-dechets-paca.com/guide-dechets-paca/module/directory/front/free/searchArticle.do;jsessionid=CE785E2D36F8FEB273B50764D1DCD847';
  console.log(`Now gathering companies.`);
  const nightmare = new Nightmare({
    show: SHOW,
    waitTimeout: 4000,
  });
  try {
    const result = await nightmare
      .goto(START)
      .evaluate(() => {
        console.log('evauate')
        return [...document.querySelectorAll('div.article-list a')]
          .map(el => ({
            name: el.childNodes[1].innerText,
            url: el.href,
          }));
      })
      .end();
    return result;
  } catch(e) {
    console.error(e);
    return undefined;
  }
}

const getCompanyInfos = async (elem, url) => {
  const nightmare = new Nightmare({
    show: SHOW,
    waitTimeout: 4000,
  });
  try {
    const result = await nightmare
      .goto(url)
      .wait('div.main-layout table tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(2) > div:nth-child(4)')
      .evaluate(() => {
        const div = document.querySelector('div.main-layout table tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(2) > div:nth-child(4)')
        return {
          contactName: div.childNodes[1].innerText,
          phone: div.childNodes[3].innerText,
          mail: div.childNodes[5].innerText,
          ...elem,
        }
      })
      .end();
    return result;
  } catch(e) {
    console.error(e);
    return {};
  }
}


const pipeline = async () => {
  let list = await getCompanyList();
  console.log(list)

  const stream = createWriteStream('./output.csv');
  stream.write(fields.join(','));
  stream.write('\n');
  let i = 0;
  list.map((elem) => {
    const { url } = elem;
    if (!url) { return true; }
    return getCompanyInfos(elem, url);
    console.log(elem)
  })
  console.log(list)
  return;
  Promise.all(list)
  list.forEach((elem) => {
    const jsonToArray = [];
    fields.forEach((field) => { jsonToArray.push(elem[field] || ''); });
    // console.log(jsonToArray);
    const csvData = csvFormatRows([jsonToArray]);
    stream.write(csvData);
    stream.write('\n');
    i += 1;
  })
  console.log(`Done. ${i} rows written.`)
  // list = await list.reduce(async (queue, elem) => {
  //   await queue;
  //   console.log(`${elem.name} is being processed.`);

  //   const { url } = elem;
  //   if (!url) { return true; }
  //   const infos = await getCompanyInfos(url);
  //   const newElem = {...elem, ...infos};
  //   console.log(newElem)
  //   const jsonToArray = [];
  //   fields.forEach((field) => { jsonToArray.push(newElem[field] || ''); });
  //   // console.log(jsonToArray);
  //   const csvData = csvFormatRows([jsonToArray]);
  //   stream.write(csvData);
  //   stream.write('\n');
  //   i += 1;
  //   return true;
  // }, Promise.resolve([]));
  // stream.end();
  // console.log(`Done. ${i} rows written.`)
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
