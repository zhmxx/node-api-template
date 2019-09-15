import { BaseModel } from "./BaseModel";
import { ObjectID } from "mongodb";

export class UserTokenModel extends BaseModel {
    user_id: ObjectID;
    token: string;
}