// ==UserScript==
// @name         vol.moe批量下载
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http*://vol.moe/comic/*.htm
// @grant        none
// @require      https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// @require      https://cdn.bootcss.com/axios/0.18.0/axios.min.js
// @require      https://cdn.bootcss.com/jszip/3.2.0/jszip.min.js
// @require      https://cdn.bootcss.com/jszip-utils/0.0.2/jszip-utils.min.js
// @require      http://pstatic.xunlei.com/js/webThunderDetect.js
// @require      http://pstatic.xunlei.com/js/base64.js
// @require      http://pstatic.xunlei.com/js/thunderBatch.js
// ==/UserScript==

(function() {
    'use strict';
    axios.interceptors.request.use(function (config) {
        console.log(config);
        return config;
      }, function (error) {
        return Promise.reject(error);
      });
    // Add a response interceptor
    axios.interceptors.response.use(function (response) {
        return response;
    }, function (error) {
        console.log(error.response)
        return Promise.reject(error);
    });


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
                <td colspan="6" align="right">
                    <span>共 <span id="total-num">0</span> 本 / 约 <span id="total-size">0</span> M </span>
                    <a id="rmj-batch-thunder-btn" href="javascript:;" class="weui-btn weui-btn_mini weui-btn_primary" style="background: #3385ff;">
                        批量下载（迅雷）
                    </a>
                    <a id="rmj-batch-btn" href="javascript:;" class="weui-btn weui-btn_mini weui-btn_primary" style="background: #3385ff;">
                        批量下载
                    </a>
                </td>
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
        
        $('#rmj-batch-thunder-btn').click(()=>{
            thunderBatchDownload(bookList.filter(b=>b.selected))
        });

        $('#rmj-batch-btn').click(()=>{
            downZip(bookList.filter(b=>b.selected))
        });

    }

    function thunderBatchDownload(books) {
        BatchTasker.BeginBatch(4, '12345');    //开始批量添加
    	books.forEach(b=>{
            BatchTasker.AddTask(ThunderEncode(b.lnk), b.fileName)

            getFileLink(b.lnk)
        })
    	BatchTasker.EndBatch('12345');    //结束添加，开始下载
    }

    //初始化迅雷插件
	function InitialActiveXObject() {
		var Thunder;
		try {
			Thunder = new ActiveXObject("ThunderAgent.Agent")
		} catch (e) {
			try {
				Thunder = new ActiveXObject("ThunderServer.webThunder.1");
			} catch (e) {
				try {
					Thunder = new ActiveXObject("ThunderAgent.Agent.1");
				} catch (e) {
					Thunder = null;
				}
			}
		}
		return Thunder;
    }
    
    //开始下载
	function Download(url) {
		var Thunder = InitialActiveXObject();
		if (Thunder == null) {
			DownloadDefault(url);
			return;
		}
		try {
			Thunder.AddTask(url, "", "", "", "", 1, 1, 10);
			Thunder.CommitTasks();
		} catch (e) {
			try {
				Thunder.CallAddTask(url, "", "", 1, "", "");
			} catch (e) {
				DownloadDefault(url);
			}
        }
    }

    //容错函数，打开默认浏览器下载
	function DownloadDefault(url) {
		//alert('打开浏览器下载.......');
	}

    const getFile = url => {
        return new Promise((resolve, reject) => {
            axios({
                method:'get',
                url,
                responseType: 'arraybuffer'
            }).then(data => {
                resolve(data.data)
            }).catch(error => {
                reject(error.toString())
            })
        })
    }

    const getFileLink = url => {
        return new Promise((resolve, reject) => {
            axios({
                method:'get',
                url,
                responseType: '*/*'
            }).then(data => {
                resolve(data.resonse)
            }).catch(error => {
                reject(error)
            })
        })
    }


    function downZip(books){ 
        handleBatchDownload(books);
   }

    function handleBatchDownload(books) {
        const zip = new JSZip();
        const cache = {};
        const promises = [];
        books.forEach(item => {
            const promise = getFile(item.lnk).then(data => { // 下载文件, 并存成ArrayBuffer对象
                const fileName = b.fileName
                zip.file(fileName, data, { binary: true }) // 逐个添加文件 
                cache[fileName] = data
            })
            promises.push(promise)
        })
        Promise.all(promises).then(() => {
            zip.generateAsync({type:"blob"}).then(content => { // 生成二进制流
                saveAs(content, ""+ bookName +".zip") // 利用file-saver保存文件
            })
        })
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
                        id: `${MOBI}-${$(td).next().find('input').val()}`,
                        filename: `${bookName}-${$(td).find('b').text().substring(2)}.${MOBI}`.replace(' ', ''),
                        size: +filesize,
                        lnk: $(td).next().find('a').attr('href'),
                        date: $(td).find('b').attr('title'),
                        selected: false,
                        fileType: MOBI,
                        bookType: mobiType
                    });

                    $(td).next().find('input').change(function() {
                        checkOne(`${MOBI}-${$(this).val()}`, $(this).prop('checked'));
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
                        id: `${EPUB}-${$(td).next().find('input').val()}`,
                        filename: `${bookName}-${$(td).find('b').text().substring(2)}.${EPUB}`.replace(' ', ''),
                        size: +filesize,
                        lnk: $(td).next().find('a').attr('href'),
                        date: $(td).find('b').attr('title'),
                        selected: false,
                        fileType: EPUB,
                        bookType: epubType
                    });

                    $(td).next().find('input').change(function() {
                        checkOne(`${EPUB}-${$(this).val()}`, $(this).attr('checked') === true);
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