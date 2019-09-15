import { UserTokenModel } from "../Model/UserTokenModel";
import { PhoneCodeModel } from "../Model/PhoneCodeModel";
import { UserModel } from "../Model/UserModel";
import { Config } from "../Config";
import { Mongo } from "../Model/Mongo";

async function init() {
    Config.init(true);

    await Mongo.init(Config.mongo);
    console.log('Mongo connected.');

    //创建定时删除索引
    await UserTokenModel.collection().createIndex({ update_time: 1 }, { expireAfterSeconds: 3600 * 24 * 7 });
    await PhoneCodeModel.collection().createIndex({ create_time: 1 }, { expireAfterSeconds: 300 });
    
    //创建唯一索引
    await PhoneCodeModel.collection().createIndex({ phone: 1 }, { unique: true });
    await UserModel.collection().createIndex({ phone: 1 }, { unique: true });
}

init();