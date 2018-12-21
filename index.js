'use strict';

const Nightmare = require('nightmare');
const { csvFormatRows } = require('d3-dsv');
const { createWriteStream } = require('fs');
const getCompanyList = require('./getCompanyList');
const saveToCSV = require('./saveToCSV');
const prompt = require('./prompt');

prompt('Do you want to refresh the company list ? (y/n)')
  .then((answer) => {
    if (answer === 'y') {
      getCompanyList().then((result) => {
        return saveToCSV('listofurl', result);
      })
    } else if (answer === 'n') {
      console.log('this is a no...')
    } else {
      console.log('I dont understand')
    }
  })

getCompanyList().then((result) => {
  return saveToCSV('listofurl', result);
})
const SHOW = false;
const fields = ['name', 'url', 'mail', 'phone', 'contactName' ];

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
}

// pipeline();