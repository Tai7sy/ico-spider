const fs = require('fs');
const request = require("axios");

const maxThread = 2;
let ing = 0;

const task = [0, 0];

function downloadCode (name, address) {
  if (ing >= maxThread) {
    setTimeout(() => {
      downloadCode(name, address);
    }, 1000);
    return;
  }
  ing++;

  request.get(`https://etherscan.io/address/${address}#code`).then(e => {
    task[1]++;
    const html = e.data;
    let code = /<pre class='js-sourcecopyarea' id='editor' .+>([\s\S]+?)<\/pre><br><s/.exec(html);
    if (code) {
      code = code[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#39;/g, '\'')
        .replace(/&copy;/g, '©');

      fs.writeFileSync("result\\" + name + ".sol", code);
      console.log(`[${task[1]}/${task[0]}] download ${address} ${name} successfully!`);
    } else {
      console.error(`[${task[1]}/${task[0]}] download ${address} ${name} no code!`);
    }
    ing--;
  }).catch(e => {
    task[1]++;
    console.error(`[${task[1]}/${task[0]}] download ${address} ${name} error with`);
    console.error(e.toString());
    ing--;
  });
}

function start () {
  const maxPage = 9;
  const doPage = page => {
    if (page > maxPage) {
      return;
    }
    request.get('http://etherscan.io/tokens?p=' + page).then(e => {
      const html = e.data;
      const token_reg = /token\/(0x\w{40})'>([^>]+?)<\/a><\/h5/g;
      let token;
      while (token = token_reg.exec(html)) {
        task[0]++;
        downloadCode(token[2], token[1]);
      }
      doPage(++page);
    });
  };
  doPage(1);
}

start();

