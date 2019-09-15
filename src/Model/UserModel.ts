import { BaseModel } from "./BaseModel";

export class UserModel extends BaseModel {
    phone: string;
    password: string;
    nick: string;
    real_name: string;
    avatar: string;
    balance: number;        // 钱包余额，单位分
    status: number;         // -1表示删除
}