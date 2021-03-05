// ==UserScript==
// @name         天猫自动下单
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://detail.tmall.com/item.htm*
// @match        https://buy.tmall.com/order/confirm_order.htm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
})();
(function () {
    'use strict';
    const URL = window.location.href
    const INTERVAL = 100 // ms
    const TASKS = [
        {
            name: '点击立即购买',
            loop: true,
            auto: false,
            url: 'https://detail.tmall.com/item.htm',
            actions: [
                {
                    selector: '#J_LinkBuy',
                    msg: '点击立即购买',
                    handler(target, context, done) {
                        if(target.innerText.trim() === '立即购买') {
                            done()
                            target.click()
                            console.log(this.msg)
                        } else {
                            console.log('当前不可用')
                        }
                    }
                }
            ]
        },
        {
            name: '结算',
            auto: true,
            url: 'https://buy.tmall.com/order/confirm_order.htm',
            actions: [
                {
                    selector: '#submitOrderPC_1 > div > a',
                    msg: '点击结算'
                }
            ]
        }
    ].filter(item => URL.indexOf(item.url) >= 0)

    const CONTEXT = {
        itId: undefined,
        task: undefined,
        run() {
            this.itId = setInterval(() => {
                this.task.actions.forEach(action => {
                    let target = document.querySelector(action.selector)
                    if (target && !action.done) {
                        if (action.handler) {
                            action.handler(target, CONTEXT, () => {
                                action.done = true
                            }) // 自定义 handler
                        } else {
                            target.click() // 默认点击事件
                            console.log(action.msg)
                        }
                    } else if (!target) {
                        console.info(`选择器目标不存在：${action.selector}`)
                    }
                })
                if (!this.task.loop) {
                    this.stop()
                }
            }, INTERVAL)
        },
        stop() {
            clearInterval(this.itId)
            console.log(`结束运行：${this.itId}`)
        },
        render() {
            if (this.task && !this.task.auto) {
                let startBtn = document.createElement('button')
                startBtn.addEventListener('click', () => {
                    this.run()
                    startBtn.style.display = 'none'
                })
                startBtn.innerText = '▶'
                const btnStyle = {
                    position: 'fixed',
                    right: '10px',
                    bottom: '10px',
                    height: '40px',
                    width: '40px',
                    border: 'none',
                    outline: 'none',
                    borderRadius: '50%',
                    backgroundColor: '#FF0036',
                    color: '#FFF',
                    fontSize: '16px'
                }
                Object.assign(startBtn.style, btnStyle)
                document.body.appendChild(startBtn)
            }
        }
    }

    if (TASKS.length) {
        CONTEXT.task = TASKS[0]
        if (CONTEXT.task.auto) {
            CONTEXT.run()
        }
        CONTEXT.render()
    }

})();
