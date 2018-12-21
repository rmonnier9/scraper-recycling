'use strict';

const puppeteer = require('puppeteer');
const d3 = require('d3-dsv');
const fs = require('fs');
const getCompanyList = require('./getCompanyList');
// const saveToCSV = require('./saveToCSV');
const prompt = require('./prompt');

const SHOW = false;

const getCompanyInfos = async (url, elem) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const selector = 'div.main-layout table tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(2) > div:nth-child(4)';

  await page.goto(url);
  await page.waitFor(selector);
  const result = await page.evaluate((s) => {
    const div = document.querySelector(s)
    return {
      contactName: div.childNodes[1].innerText,
      phone: div.childNodes[3].innerText,
      mail: div.childNodes[5].innerText,
    }
  }, selector)
  await browser.close();
  return { ...result, ...elem };
}

prompt('Do you want to refresh the company list ?')
.then((response) => {
  if (response === 'y') {
    return getCompanyList()
    .then((result) => {
      const stream = fs.createWriteStream('./output.csv');
      const csv = d3.csvFormat(result);

      stream.write(csv);
      stream.end();
      return result;
    })
  } else {
    const csv = fs.readFileSync('./output.csv', 'utf8')
    const result = d3.csvParse(csv);
    return result;
  }
})
.then(async (list) => {
  const fields = [ 'name', 'url', 'mail', 'phone', 'contactName' ];
  const stream = fs.createWriteStream('./companyInfos.csv');
  stream.write(fields.join(','));
  stream.write('\n');
  const writeElem = (elem) => {
    const jsonToArray = [];
    fields.forEach((field) => { jsonToArray.push(elem[field] || ''); });
    const csvData = d3.csvFormatRows([jsonToArray]);
    stream.write(csvData);
    stream.write('\n');
  }


  const result = [];
  let i = 0;

  await list.reduce(async (queue, elem) => {
    await queue;
    console.log(`${elem.name} is being processed.`);

    const { url } = elem;
    if (!url) { return true; }
    try {
      const infos = await getCompanyInfos(url, elem);
      const newElem = {...elem, ...infos};
      writeElem(newElem);
      i += 1;
      return true;
    } catch(e) {
      writeElem(elem);
      return true;
    }
  }, Promise.resolve([]));

})