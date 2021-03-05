// ==UserScript==
// @name         小米官网自动下单
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       溶酶菌
// @match        https://www.mi.com/buy/detail?product_id=*
// @match        https://www.mi.com/buy/successTip*
// @match        https://www.mi.com/buy/cart
// @match        https://www.mi.com/buy/checkout*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const URL = window.location.href
    const INTERVAL = 100 // ms
    const TASKS = [
        {
            name: '添加到购物车',
            loop: true,
            auto: false,
            url: 'https://www.mi.com/buy/detail',
            actions: [
                {
                    selector: '.sale-btn > a:nth-child(1)',
                    msg: '尝试添加到购物车...',
                    handler(target, context, done) {
                        if(target.innerText.trim() === '加入购物车') {
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
            name: '跳转到购物车',
            auto: true,
            url: 'https://www.mi.com/buy/successTip',
            actions: [
                {
                    selector: '.buy-succ-box .J_actBox > a:nth-child(3)',
                    msg: '尝试跳转到购物车...'
                }
            ]
        },
        {
            name: '去结算',
            auto: true,
            url: 'https://www.mi.com/buy/cart',
            actions: [
                {
                    selector: '.mi-cart .cart-wrap > .cart-bar > .total-price > a',
                    msg: '尝试结算...'
                }
            ]
        },
        {
            name: '下单',
            auto: true,
            url: 'https://www.mi.com/buy/checkout',
            actions: [
                {
                    selector: '.mi-checkout .address-detail > .address-list > .address-item:nth-child(1)',
                    msg: '尝试选择收货地址...'
                },
                {
                    selector: '.mi-checkout .footer-detail > .handle-action .operating-button > a:nth-child(1)',
                    msg: '尝试下单...'
                }
            ]
        }
    ].filter(item => URL.indexOf(item.url) >= 0)

    const CONTEXT = {
        itId: undefined,
        task: undefined,
        completed: false,
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
                            action.done = true
                            target.click() // 默认点击事件
                            console.log(action.msg)
                        }
                    } else if (!target) {
                        console.info(`选择器目标不存在：${action.selector}`)
                    }
                })
                this.completed = true
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
                    backgroundColor: '#FF6700',
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
