const { csvFormat } = require('d3-dsv');
const Nightmare = require('nightmare');
const { readFileSync, writeFileSync } = require('fs');
const numbers = readFileSync('./tesco-title-numbers.csv', { encoding: 'utf8' })
  .trim().split('\n');

const START = 'http://www.guide-dechets-paca.com/guide-dechets-paca/module/directory/front/free/searchArticle.do;jsessionid=CE785E2D36F8FEB273B50764D1DCD847';
const getAddress = async id => {
  console.log(`Now checking ${id}`);
  const nightmare = new Nightmare({ show: true });

  // Go to initial start page, navigate to Detail search
  try {
    await nightmare
      .goto(START)
      .wait('.bodylinkcopy:first-child')
      .click('.bodylinkcopy:first-child');
  } catch(e) {
    console.error(e);
  }

  // Type the title number into the appropriate box; click submit
  try {
    await nightmare
      .wait('input[name="titleNo"]')
      .type('input[name="titleNo"]', id)
      .click('input[value="Search »"]');
  } catch(e) {
    console.error(e);
  }

  // Data extraction
  try {
  const result = await nightmare
    .wait('.w80p')
    .evaluate(() => {
      return [...document.querySelectorAll('.w80p')]
        .map(el => el.innerText);
    })
    .end();
  return { id, address: result[0], lease: result[1] };
} catch(e) {
  console.error(e);
  return undefined;
}
};

const series = numbers.reduce(async (queue, number) => {
  const dataArray = await queue;
  dataArray.push(await getAddress(number));
  return dataArray;
}, Promise.resolve([]));

series.then(data => {
  const csvData = csvFormat(data.filter(i => i));
  writeFileSync('./output.csv', csvData, { encoding: 'utf8' });
})
.catch(e => console.error(e));
