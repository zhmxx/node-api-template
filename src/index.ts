import { Mongo } from "./Model/Mongo";
import { Config } from "./Config";
import { Logger } from "./Component/Logger";

async function run() {
    let prod = (process.env.NODE_ENV == 'production');
    console.log('prod: ', prod ? 'true' : 'false');
    Config.init(prod);

    // 初始化Mongo
    await Mongo.init(Config.mongo);
    console.log('Mongo connected.');

    // 初始化Logger
    Logger.init();

    //jsonrpc接口const Koa = require('koa');
    const Koa = require('koa');
    const bodyParser = require('koa-bodyparser');
    const { JsonRpcHandler, JsonRpcError } = require('tian-jsonrpc');
    const requireAll = require('require-all');

    const controllers = requireAll(__dirname + '/Front/Controller');
    const backControllers = requireAll(__dirname + '/Back/Controller');
    const jsonRpc = new JsonRpcHandler();

    //注册前台接口
    Object.keys(controllers).forEach(className => {
        try {
            const controller = controllers[className][className];
            const methodNames = Object.getOwnPropertyNames(controller);
            for (let methodName of methodNames) {
                if (methodName !== 'length' && methodName !== 'prototype' && methodName !== 'name') {
                    jsonRpc.setHandler(`${className.replace('Controller', '')}.${methodName}`, controller[methodName]);
                }
            }
        } catch (error) {
            console.error(`failed to register ${className}`, error);
        }
    });
    jsonRpc.setOnUnexpectedError(function (error) {
        console.error(error);
        if (error.message) {
            return error.message;
        }
    });

    const app = new Koa();
    if (prod) {
        const cors = require('@koa/cors');
        app.use(cors({
            'Access-Control-Allow-Origin': '*'
        }));
    }
    app.use(bodyParser());
    app.use(async ctx => {
        if (ctx.method === 'GET') {
            ctx.body = Object.keys(jsonRpc.methods);
        } else if (ctx.method === 'POST') {
            Logger.debug('[api] ' + JSON.stringify(ctx.request.body));
            if (JSON.stringify(ctx.request.body).indexOf('"$') !== -1) {
                throw JsonRpcError.alert('非法请求');
            }
            ctx.body = await jsonRpc.handle(ctx.request.body);
            Logger.info('[api result] ' + JSON.stringify(ctx.body));
        }
    });

    app.listen(Config.port, '0.0.0.0', function () {
        console.log('Server started.');
    });
}

run();