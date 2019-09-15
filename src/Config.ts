export class Config {
    static prod = false;
    static mongo = '';
    static defaultPageSize = 30;

    static logLevel;

    static host;
    static port;

    static init(prod) {
        Config.prod = prod;
        Config.mongo = prod ? 'mongodb://user:password@127.0.0.1:27017/demo'
                            : 'mongodb://user:password@dev:27017/demo';
        
        Config.logLevel = 3;

        Config.host = prod ? 'www.prod.com' : 'www.dev.com';
        Config.port = '9000';
    }
}