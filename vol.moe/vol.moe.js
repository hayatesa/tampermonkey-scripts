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

    render();
    /*
        1 mobi 单行本
        2 mobi 连载话
        3 epub 单行本
        4 epub 连载话
     */
    const [MOBI_TYPE_1, MOBI_TYPE_2, EPUB_TYPE_1, EPUB_TYPE_2] = [1, 2, 3, 4]
    const [MOBI, EPUB] = ['mobi', 'epub']; // tab
    let current = MOBI;
    const bookName = getBookName();
    const bookList = [].concat(getBookListForMobi()).concat(getBookListForEpub());

    let totalSize = 0;
    let totalNum = 0;

    function render() {
        const tab = $('.book_list')[1];
        const ctrl = $(tab).find('tbody');
        $(ctrl).css('width', '100px');
        $(ctrl).append(`
            <tr>
                <td colspan="6" align="right"><a id="rmj-batch-btn" href="javascript:;" class="weui-btn weui-btn_mini weui-btn_primary" id="follow_button_yes" style="">
                    批量下载 ( 共 <span id="total-num">0</span> 本 / 约 <span id="total-size">0</span> M )
                </a></td>
            </tr>
        `)

        const typeTab = $(ctrl).find('tr')[1];

        const mobiTab = $(typeTab).find('td')[0];
        $(mobiTab).find('a').click(()=>{
            current = MOBI;
        })
        const epubTab = $(typeTab).find('td')[1];
        $(epubTab).find('a').click(()=>{
            current = EPUB;
        })
        

        $('#rmj-batch-btn').click(()=>{
            console.log(bookList);
        });

    }

    function getBookName() {
        return $('#author b').text();
    }

    function addNumber(a, b) {
        const result = (Number(a) + Number(b))
        return result > 0 ? result.toFixed(1) : 0 ;
    }

    function changeCount(selected, size) {
        if(selected) {
            totalNum ++;
            totalSize = addNumber(totalSize,  size);
        } else {
            totalNum --;
            totalSize = addNumber(totalSize,  -size);
        }
        $('#total-num').text(totalNum);
        $('#total-size').text(totalSize);
    }
    
    function checkAll(selected, bookType) {
        bookList.forEach(b=>{
            if(current === b.fileType && b.bookType === bookType) {
                b.selected = selected;
                changeCount(selected, b.size)
            }
        })
    }

    function checkOne(id, selected) {
        for(let i = 0; i < bookList.length; i++) {
            let b = bookList[i];
            if(b.id === id) {
                b.selected = selected;
                changeCount(selected, b.size)
                break;
            }
        }
       
    }

    function getBookListForMobi() {
        const bookListOfMobi = [];
        let mobiType = 0
        $('#div_mobi .book_list tr').each((i, tr) => {
            if ($(tr).find('#checkbox_all_mobi_1').length) {
                mobiType = MOBI_TYPE_1;
                $('#checkbox_all_mobi_1').change(function() {
                    checkAll($(this).prop('checked'), MOBI_TYPE_1);
                });
            } else if ($(tr).find('#checkbox_all_mobi_4').length) {
                mobiType = MOBI_TYPE_2;
                $('#checkbox_all_mobi_4').change(function() {
                    checkAll($(this).prop('checked'), MOBI_TYPE_2);
                });
            }
            
            if($(tr).hasClass('listbg1') || $(tr).hasClass('listbg2')) {
                const tdList = $(tr).find('td');
                function add(td) {
                    let filesize = $(td).find('.filesize').text()
                    filesize = filesize.substring(0, filesize.indexOf('M'))

                    bookListOfMobi.push({
                        id: $(td).next().find('input').val(),
                        filename: `${bookName}-${$(td).find('b').text().substring(2)}.${MOBI}`,
                        size: +filesize,
                        lnk: $(td).next().find('a').attr('href'),
                        date: $(td).find('b').attr('title'),
                        selected: false,
                        fileType: MOBI,
                        bookType: mobiType
                    });

                    $(td).next().find('input').change(function() {
                        checkOne($(this).val(), $(this).prop('checked'));
                    });
                }

                add(tdList[0]);
                if(tdList.length === 6) {
                    add(tdList[3]);
                }
            }
        });
        return bookListOfMobi;
    }

    function getBookListForEpub() {
        const bookListOfEpub = [];
        let epubType = 0;
        $('#div_cbz .book_list tr').each((i,tr) => {
            if ($(tr).find('#checkbox_all_epub_1').length) {
                epubType = EPUB_TYPE_1;
                $('#checkbox_all_epub_1').change(function() {
                    checkAll($(this).prop('checked'), EPUB_TYPE_1);
                });
            } else if ($(tr).find('#checkbox_all_epub_4').length) {
                epubType = EPUB_TYPE_2;
                $('#checkbox_all_epub_4').change(function() {
                    checkAll($(this).prop('checked'), EPUB_TYPE_2);
                });
            }

            if($(tr).hasClass('listbg1') || $(tr).hasClass('listbg2')) {
                const tdList = $(tr).find('td');
                function add(td) {
                    let filesize = $(td).find('.filesize').text()
                    filesize = filesize.substring(0, filesize.indexOf('M'))

                    bookListOfEpub.push({
                        id: $(td).next().find('input').val(),
                        filename: `${bookName}-${$(td).find('b').text().substring(2)}.${EPUB}`,
                        size: +filesize,
                        lnk: $(td).next().find('a').attr('href'),
                        date: $(td).find('b').attr('title'),
                        selected: false,
                        fileType: EPUB,
                        bookType: epubType
                    });

                    $(td).next().find('input').change(function() {
                        checkOne($(this).val(), $(this).attr('checked') === true);
                    });
                }

                add(tdList[0]);
                if(tdList.length === 6) {
                    add(tdList[3]);
                }
            }
        });
        return bookListOfEpub;
    }

})();