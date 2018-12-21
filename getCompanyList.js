'use strict';

const puppeteer = require('puppeteer');
const SHOW = false;

const getCompanyList = async () => {
    const url = 'http://www.guide-dechets-paca.com/guide-dechets-paca/module/directory/front/free/searchArticle.do;jsessionid=CE785E2D36F8FEB273B50764D1DCD847';
    const selector = 'div.article-list a';

    console.log(`Now gathering companies.`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
  
    await page.goto(url);
    const result = await page.evaluate((s) => {
      return [...document.querySelectorAll(s)]
        .map(el => ({
          name: el.childNodes[1].innerText,
          url: el.href,
        }));
    }, selector);
    await browser.close();
    return result;
  }

  module.exports = getCompanyList;