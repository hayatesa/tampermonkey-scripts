// ==UserScript==
// @name         京东自动下单
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       溶酶菌
// @match        https://item.jd.com/*
// @match        https://cart.jd.com/addToCart.html*
// @match        https://cart.jd.com/cart_index/*
// @match        https://trade.jd.com/shopping/order/getOrderInfo.action*
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
            url: 'https://item.jd.com/',
            actions: [
                {
                    selector: '#InitCartUrl',
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
            url: 'https://cart.jd.com/addToCart.html',
            actions: [
                {
                    selector: '#GotoShoppingCart',
                    msg: '尝试跳转到购物车...'
                }
            ]
        },
        {
            name: '去结算',
            auto: true,
            loop: true,
            url: 'https://cart.jd.com/cart_index/',
            actions: [
                {
                    selector: '.cart-toolbar .options-box .common-submit-btn',
                    msg: '去结算...'
                }
            ]
        },
        {
            name: '下单',
            auto: true,
            loop: true,
            url: 'https://trade.jd.com/shopping/order/getOrderInfo.action',
            actions: [
                {
                    selector: '#order-submit > b',
                    msg: '提交订单'
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
                    backgroundColor: '#E3211E',
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
