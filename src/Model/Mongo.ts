import { MongoClient, Db, Collection } from "mongodb";
import { BaseModel } from "./BaseModel";
import { JsonRpcError } from "tian-jsonrpc";

export class Mongo {
    static db: Db;
    static client;

    static async init(url) {
        Mongo.client = await MongoClient.connect(url, {
            useNewUrlParser: true
        });
        Mongo.db = Mongo.client.db();
    }

    static collection<T extends BaseModel>(modelClass: { new(): T } & typeof BaseModel): Collection<T> {
        return Mongo.db.collection<T>(modelClass.getTableName());
    }

    static async performTransaction(operationFunc: Function, errMsg: string) {
        const session = Mongo.client.startSession();
        session.startTransaction();
        try {
            let ret = await operationFunc();
            await session.commitTransaction();
            session.endSession();
            return ret;
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            throw JsonRpcError.alert('Transaction error: ' + errMsg);
        }
    }
}