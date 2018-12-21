const d3 = require('d3-dsv');
const { createWriteStream } = require('fs');

const fields = ['name', 'url' ];

// Save an array of object into a CSV

const saveToCSV = async (filename, list) => {
    const stream = createWriteStream(filename);
    // stream.write(fields.join(','));
    // stream.write('\n');
    let i = 0;
    stream.write(d3.csvFormat(list))
    // list.forEach((elem) => {
    //     const jsonToArray = [];
    //     fields.forEach((field) => { jsonToArray.push(elem[field] || ''); });
    //     const csvData = csvFormatRows([jsonToArray]);
    //     stream.write(csvData);
    //     stream.write('\n');
    //     i += 1;
    // })
    // console.log(`${i} rows have been written into ${filename}\n`)
}

  module.exports = saveToCSV;