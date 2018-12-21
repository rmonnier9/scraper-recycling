const Nightmare = require('nightmare');
const SHOW = false;

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

  module.exports = getCompanyList;