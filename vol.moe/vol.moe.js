// ==UserScript==
// @name         vol.moe批量下载
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://vol.moe/comic/*.htm
// @grant        none
// @require      https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// @require      https://cdn.bootcss.com/axios/0.18.0/axios.min.js
// @require      https://cdn.bootcss.com/jszip/3.2.0/jszip.min.js
// @require      https://cdn.bootcss.com/jszip-utils/0.0.2/jszip-utils.min.js
// ==/UserScript==

(function() {
    'use strict';
   
    const [domClsOfMobi, domClsOfEpub] = ['#div_mobi', '#div_cbz'];
    const bookListOfMobi = $(domClsOfMobi);
    const bookListOfEpub = $(domClsOfEpub);

    let b = {
        title: '',
        size: '',
        lnk: '',
        date: ''
    }

    let id = 0;
    const bls = [];
    $('#div_mobi .book_list tr').each((i,tr) => {
        if($(tr).hasClass('listbg1') || $(tr).hasClass('listbg2')) {
            const tdList = $(tr).find('td');
            function add(td) {
                let filesize = $(td).find('.filesize').text().indexOf('M')

                bls.push({
                    id: id++,
                    title: $(td).find('b').text().substring(2),
                    size: $(td).find('.filesize').text().indexOf('M'),
                    lnk: '',
                    date: $(td).find('b').attr('title')
                });
            }
            add(tdList[0]);
            if(tdList.length === 6) {
                add(tdList[3]);
            }
        }
    });

    console.log(bls);

})();