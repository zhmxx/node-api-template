import { ObjectID } from "mongodb";
import { DBRef } from "bson";
import { Mongo } from "./Mongo";
import { Collection } from 'mongodb';

export class BaseModel {
    _id: ObjectID;
    create_time: Date;
    update_time: Date;

    constructor(raw?: Object) {
        Object.assign(this, raw);
        if (!this.create_time) this.create_time = new Date();
        if (!this.update_time) this.update_time = this.create_time;
    }

    static collection<T extends BaseModel>(this: { new(): T } & typeof BaseModel): Collection<T> {
        return Mongo.collection(this);
    }

    /**
     * 如果有_id则进行update操作，否则新增记录
     */
    async save(upsert = false) {
        if (upsert) {
            this.update_time = new Date();
            await this.update(true);
        }
        else if (this._id) {
            this.update_time = new Date();
            await this.update();
        } else {
            await this.insert();
        }
    }

    static getTableName() {
        return this.name.replace(/Model$/, '');
    }

    static async deleteById(id: string | ObjectID) {
        let oid = id instanceof ObjectID ? id : new ObjectID(id);
        await this.collection().remove({ _id: oid });
    }

    static createDBRef(id: string | ObjectID) {
        return new DBRef(this.name.replace(/Model$/, ''), typeof id == 'string' ? new ObjectID(id) : id);
    }

    static async findById<T extends BaseModel>(this: { new(): T } & typeof BaseModel, id: string | ObjectID): Promise<T> {
        let oid = id instanceof ObjectID ? id : new ObjectID(id);
        let ret = await this.collection().findOne({ _id: oid });
        if (ret) {
            return new this(ret) as T;
        }
        return null;
    }

    /**
     * 设置记录的ID
     * @param id 记录的_id
     */
    setId(id: string | ObjectID) {
        if (id instanceof ObjectID) {
            this._id = id;
        } else {
            this._id = new ObjectID(id);
        }
    }

    getCollection(): Collection {
        let ctr: any = this.constructor;
        return ctr.collection();
    }
    async insert() {
        await this.getCollection().insert(this);
    }
    async update(upsert = false) {
        if (upsert) {
            await this.getCollection().updateOne({ _id: this._id }, { $set: this }, { upsert: true });
        } else {
            await this.getCollection().updateOne({ _id: this._id }, { $set: this });
        }
    }
}